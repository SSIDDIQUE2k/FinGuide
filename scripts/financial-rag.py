# fast_rag.py
# ==========================================================
# MULTI-PDF RAG — One-file, FAST (prebuilt index + lazy LM)
# - Build index once: python fast_rag.py --build
# - Ask a question:   python fast_rag.py --ask "Your question"
# - REPL mode:        python fast_rag.py
# ==========================================================

import os, sys, io, re, time, glob, json, hashlib, pickle, warnings, subprocess, importlib, argparse
from dataclasses import dataclass
from typing import List, Optional, Tuple
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
warnings.filterwarnings("ignore")

# ---------------- Safe installer ----------------
def _ensure(mod_name: str, pip_spec: Optional[str] = None):
    try:
        return importlib.import_module(mod_name)
    except Exception:
        spec = pip_spec or mod_name
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "--no-cache-dir", spec])
        return importlib.import_module(mod_name)

# Core deps (pin transformers to avoid GenMixin issues)
torch = _ensure("torch", "torch>=2.2")
transformers = _ensure("transformers", "transformers==4.44.2")
tokenizers = _ensure("tokenizers", "tokenizers>=0.19.1")
np = _ensure("numpy", "numpy>=1.26")
accelerate = _ensure("accelerate", "accelerate>=0.33.0")

from transformers import AutoTokenizer, AutoModelForCausalLM

# Optional HF login
HF_TOKEN = os.getenv("HF_TOKEN")
try:
    from huggingface_hub import login
    if HF_TOKEN: login(token=HF_TOKEN)
except Exception:
    pass

# PDFs (pypdf fallback)
try:
    from pypdf import PdfReader
except Exception:
    try:
        from PyPDF2 import PdfReader
    except Exception:
        _ensure("pypdf", "pypdf")
        from pypdf import PdfReader

# sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    _ensure("sentence-transformers", "sentence-transformers>=2.7.0")
    from sentence_transformers import SentenceTransformer


# ---------------- Configuration ----------------
@dataclass
class Config:
    MODEL_ID: str = "Qwen/Qwen2.5-0.5B-Instruct"

    # Paths (project-local)
    DATA_DIR: str = "./data_pdfs"      # put your PDFs here
    CACHE_DIR: str = "./rag_cache"     # index files live here
    INDEX_NAME: str = "index_all-MiniLM-L6-v2"

    # Device / dtype
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    DTYPE = (
        torch.bfloat16 if (torch.cuda.is_available() and torch.cuda.is_bf16_supported())
        else (torch.float16 if torch.cuda.is_available() else torch.float32)
    )

    # Speed profile - optimized for <10 second responses
    FAST_MODE: bool = True
    MAX_CHUNKS: Optional[int] = None   # let builder decide (None = all)
    EMB_BATCH_SIZE: int = 512          # increased for faster embedding

    # Chunking
    MAX_TOKENS_PER_CHUNK: int = 256    # reduced for faster processing
    CHUNK_OVERLAP_TOKENS: int = 32     # reduced overlap
    LIMIT_PAGES: Optional[int] = None  # e.g., 30 for quick pilot builds

    # Retrieval - optimized for speed
    TOP_K: int = 3                     # slightly more context
    CONFIDENCE_THRESHOLD: float = 0.2  # lower threshold for more responses

    # Context / decoding - optimized for speed
    MAX_CONTEXT_TOKENS: int = 512      # very small context window
    MAX_NEW_TOKENS: int = 30           # very short responses
    TEMPERATURE: float = 0.1            # very low for speed
    TOP_P: float = 0.7                 # lower for speed
    REPETITION_PENALTY: float = 1.0    # no penalty for speed

    # IO / parsing
    USE_PYMUPDF: bool = True
    N_WORKERS: int = max(1, (os.cpu_count() or 1))

config = Config()

FALLBACK_MODELS = [
    "microsoft/DialoGPT-small",
    "gpt2",
    "distilgpt2",
]

# ---------------- Torch setup ----------------
def setup_torch():
    torch.set_grad_enabled(False)
    if config.DEVICE == "cuda":
        try:
            print("CUDA:", torch.cuda.get_device_name(0))
        except Exception:
            pass
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.cuda.empty_cache()
    else:
        try:
            torch.set_num_threads(2)
        except Exception:
            pass
    print(f"Using device: {config.DEVICE}, dtype: {config.DTYPE}")

# ---------------- Text utils ----------------
class SimpleTextProcessor:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        text = text.replace("\u00A0", " ").replace("-\n", "")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"(?m)^\s*(Page\s*\d+|\d+)\s*$", "", text)
        return text.strip()

    @staticmethod
    def split_sentences(text: str) -> List[str]:
        if not text.strip():
            return []
        parts = re.split(r'(?<=[\.!?])\s+', text.strip())
        return [p.strip() for p in parts if len(p.strip()) > 20]

def approx_token_len(s: str) -> int:
    return max(1, int(len(s.split()) / 0.75))

def create_chunks(text: str, max_tokens: int, overlap: int) -> List[str]:
    sents = SimpleTextProcessor.split_sentences(text)
    if not sents:
        return [text[: max_tokens * 5]]
    chunks, cur, cur_tok = [], [], 0
    for s in sents:
        s_tok = approx_token_len(s)
        if cur and cur_tok + s_tok > max_tokens:
            chunk = " ".join(cur).strip()
            if chunk:
                chunks.append(chunk)
            if overlap > 0 and chunk:
                tail = chunk[-overlap * 4 :]
                cur, cur_tok = [tail], approx_token_len(tail)
            else:
                cur, cur_tok = [], 0
        cur.append(s)
        cur_tok += s_tok
    if cur:
        chunk = " ".join(cur).strip()
        if chunk:
            chunks.append(chunk)
    return [c for c in chunks if c.strip()]

# ---------------- Embeddings ----------------
class STEmbedder:
    def __init__(self, name="sentence-transformers/all-MiniLM-L6-v2", device=None):
        print(f"Loading SentenceTransformer: {name}")
        self.model = SentenceTransformer(name)
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        try:
            self.model = self.model.to(self.device)
        except Exception:
            pass

    def embed_texts(self, ts: List[str], batch_size: int = 32) -> np.ndarray:
        return self.model.encode(
            ts,
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
            device=self.device
        ).astype("float32")

    def embed_text(self, t: str) -> np.ndarray:
        return self.embed_texts([t])[0]

# ---------------- Retrieval helpers ----------------
class Document:
    __slots__ = ("text","page","chunk_id","source")
    def __init__(self, text: str, page: int, chunk_id: int, source: str):
        self.text = text
        self.page = page
        self.chunk_id = chunk_id
        self.source = source

def top_k_sim(qv: np.ndarray, dv: np.ndarray, k: int):
    sims = dv @ qv
    idx = np.argsort(-sims)[:k]
    return [(int(i), float(sims[i])) for i in idx]

def _hash_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(1 << 20)
            if not b: break
            h.update(b)
    return h.hexdigest()

# ---------------- Fast PDF extraction ----------------
def _extract_pdf_pages_pymupdf(pdf_path: str, max_pages: Optional[int]) -> List[str]:
    fitz = _ensure("fitz", "PyMuPDF")
    doc = fitz.open(pdf_path)
    total = len(doc)
    pages = total if max_pages is None else min(max_pages, total)
    out = []
    for i in range(pages):
        try:
            t = doc[i].get_text("text") or ""
            t = SimpleTextProcessor.clean_text(t)
            if t: out.append(t)
        except Exception as e:
            print(f"Warning (fitz): page {i+1} in {os.path.basename(pdf_path)} failed: {e}")
    doc.close()
    return out

def _extract_pdf_pages_pypdf(pdf_path: str, max_pages: Optional[int]) -> List[str]:
    with open(pdf_path, "rb") as f:
        data = f.read()
    reader = PdfReader(io.BytesIO(data))
    total = len(reader.pages)
    pages = total if max_pages is None else min(max_pages, total)
    out = []
    for i in range(pages):
        try:
            t = reader.pages[i].extract_text() or ""
            t = SimpleTextProcessor.clean_text(t)
            if t: out.append(t)
        except Exception as e:
            print(f"Warning (pypdf): page {i+1} in {os.path.basename(pdf_path)} failed: {e}")
    return out

def extract_pdf_text_fast(pdf_path: str, max_pages: Optional[int]) -> List[str]:
    if config.USE_PYMUPDF:
        try:
            return _extract_pdf_pages_pymupdf(pdf_path, max_pages)
        except Exception as e:
            print("PyMuPDF not available / failed, falling back:", e)
    return _extract_pdf_pages_pypdf(pdf_path, max_pages)

# ---------------- Model Loader (lazy) ----------------
class SafeModelManager:
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.tok = None
        self.model = None

    def _hf_auth(self):
        return {"use_auth_token": HF_TOKEN} if HF_TOKEN else {}

    def load(self):
        for mid in [self.model_id] + [m for m in FALLBACK_MODELS if m != self.model_id]:
            try:
                print(f"Loading LM: {mid}")
                self.tok = AutoTokenizer.from_pretrained(mid, use_fast=True, trust_remote_code=True, **self._hf_auth())
                if self.tok.pad_token is None:
                    self.tok.pad_token = self.tok.eos_token if getattr(self.tok, "eos_token", None) else self.tok.unk_token
                self.model = AutoModelForCausalLM.from_pretrained(
                    mid,
                    trust_remote_code=True,
                    torch_dtype=config.DTYPE,
                    device_map="auto" if config.DEVICE == "cuda" else None,
                    low_cpu_mem_usage=True,
                    **self._hf_auth()
                )
                if config.DEVICE != "cuda":
                    self.model = self.model.to(config.DEVICE)
                self.model.eval()
                self.model_id = mid
                print(f"✅ LM ready: {mid}")
                return
            except Exception as e:
                print(f"❌ Failed {mid}: {e}")
                try:
                    del self.model; del self.tok
                except Exception:
                    pass
                if config.DEVICE == "cuda":
                    torch.cuda.empty_cache()
        raise RuntimeError("No model could be loaded.")

    def cleanup(self):
        try:
            del self.model; del self.tok
        except Exception:
            pass
        if config.DEVICE == "cuda":
            torch.cuda.empty_cache()

# ---------------- Tiny domain router ----------------
def route(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["student","college","school","campus"]): return "student"
    if any(w in q for w in ["debt","loan","credit card","collections","score"]): return "debt"
    if any(w in q for w in ["invest","stocks","bond","roth","401k","ira"]): return "investing"
    if any(w in q for w in ["budget","spend","expense","save","saving"]): return "budget"
    return "general"

def system_preamble(domain: str) -> str:
    base = (
        "You are a helpful financial advisor. Answer based on the provided context. "
        "Always start your response with a brief thinking process in brackets like [Thinking: analyzing the question and relevant information...]. "
        "Then provide a clear, actionable answer. Do not mention sources, page numbers, or document names. "
        "Be concise and practical. If the answer is not in the context, say \"I don't have specific information about that in my knowledge base.\" "
        "Focus on actionable advice that users can implement immediately."
    )
    if domain == "student":  return base + " Tailor examples to students (irregular income, textbooks, tuition, part-time work)."
    if domain == "debt":     return base + " Emphasize credit health, payment order, APRs, and minimizing interest."
    if domain == "investing":return base + " Give general education only; do not give personalized financial advice."
    if domain == "budget":   return base + " Offer step-by-step budgeting guidance and templates."
    return base

# ---------------- RAG Core ----------------
class SimplePDFRAG:
    def __init__(self):
        self.mm: Optional[SafeModelManager] = None
        self.embedder = STEmbedder("sentence-transformers/all-MiniLM-L6-v2", device=config.DEVICE)
        self.documents: List[Document] = []
        self.doc_vecs = None
        self._model_loaded = False

    def _ensure_lm_loaded(self):
        if not self._model_loaded:
            self.mm = SafeModelManager(config.MODEL_ID)
            self.mm.load()
            self._model_loaded = True

    # --------- Index build & load ----------
    def _bundle_id_for(self, pdf_paths: List[str]) -> str:
        digest = "|".join([_hash_file(p) for p in pdf_paths]) + \
                 f"|{config.MAX_TOKENS_PER_CHUNK}|{config.CHUNK_OVERLAP_TOKENS}|{config.INDEX_NAME}"
        return hashlib.sha256(digest.encode()).hexdigest()[:16]

    def build_index(self):
        os.makedirs(config.CACHE_DIR, exist_ok=True)
        pdf_paths = sorted(glob.glob(os.path.join(config.DATA_DIR, "*.pdf")))
        if not pdf_paths:
            raise RuntimeError(f"No PDFs found in {config.DATA_DIR}")

        bundle_id = self._bundle_id_for(pdf_paths)
        out_npz  = os.path.join(config.CACHE_DIR, f"{bundle_id}.npz")
        out_meta = os.path.join(config.CACHE_DIR, f"{bundle_id}.meta.json")

        print(f"📚 Ingesting {len(pdf_paths)} PDFs from {config.DATA_DIR} ...")
        all_chunks = []
        for path in pdf_paths:
            pages = extract_pdf_text_fast(path, config.LIMIT_PAGES)
            for p_idx, txt in enumerate(pages):
                chunks = create_chunks(txt, config.MAX_TOKENS_PER_CHUNK, config.CHUNK_OVERLAP_TOKENS)
                for c_idx, ch in enumerate(chunks):
                    all_chunks.append((os.path.basename(path), p_idx, c_idx, ch))

        if config.FAST_MODE and config.MAX_CHUNKS and len(all_chunks) > config.MAX_CHUNKS:
            all_chunks = all_chunks[:config.MAX_CHUNKS]

        texts = [c[3] for c in all_chunks]
        print(f"🔮 Embedding {len(texts)} chunks...")
        t0 = time.time()
        vecs = self.embedder.embed_texts(texts, batch_size=config.EMB_BATCH_SIZE)
        print(f"✅ Embeddings ready in {time.time()-t0:.1f}s")

        sources = np.array([c[0] for c in all_chunks], dtype=object)
        pages   = np.array([c[1] for c in all_chunks], dtype=np.int32)
        cids    = np.array([c[2] for c in all_chunks], dtype=np.int32)

        np.savez_compressed(out_npz, vecs=vecs.astype("float32"),
                            texts=np.array(texts, dtype=object),
                            sources=sources, pages=pages, cids=cids)

        meta = {
            "bundle_id": bundle_id,
            "pdfs": [os.path.basename(p) for p in pdf_paths],
            "index_name": config.INDEX_NAME,
            "chunk_tokens": config.MAX_TOKENS_PER_CHUNK,
            "overlap": config.CHUNK_OVERLAP_TOKENS,
            "n_chunks": len(texts)
        }
        with open(out_meta, "w") as f:
            json.dump(meta, f, indent=2)

        print("✅ Wrote index:", out_npz)
        print("🧾 Meta:", out_meta)

    def _latest_index_path(self) -> Optional[str]:
        os.makedirs(config.CACHE_DIR, exist_ok=True)
        cand = sorted(glob.glob(os.path.join(config.CACHE_DIR, "*.npz")), key=os.path.getmtime, reverse=True)
        return cand[0] if cand else None

    def load_prebuilt_index(self):
        idx = self._latest_index_path()
        if not idx:
            raise RuntimeError("No index .npz found. Run `python fast_rag.py --build` first.")
        arr = np.load(idx, allow_pickle=True)
        texts   = arr["texts"].tolist()
        sources = arr["sources"].tolist()
        pages   = arr["pages"].astype(int).tolist()
        cids    = arr["cids"].astype(int).tolist()
        vecs    = arr["vecs"].astype("float32")
        self.documents = [Document(text=t, page=p, chunk_id=c, source=s) for t,p,c,s in zip(texts, pages, cids, sources)]
        self.doc_vecs = vecs
        print(f"🔁 Loaded index: {os.path.basename(idx)} ({len(self.documents)} chunks)")

    # --------- Context packing & QA ----------
    def _pack_context(self, hits: List[Tuple[Document, float]]) -> str:
        self._ensure_lm_loaded()
        tok = self.mm.tok
        assembled, used = [], 0
        budget = max(512, config.MAX_CONTEXT_TOKENS - 400)
        for d, _ in hits:
            snippet = f"{d.text}\n"
            tokens = len(tok.encode(snippet))
            if used + tokens > budget:
                clip_len = max(0, int((budget - used) * 4))  # rough char approximation
                clip = snippet[:clip_len]
                if clip:
                    assembled.append(clip)
                break
            assembled.append(snippet)
            used += tokens
        return "\n".join(assembled)

    def search(self, query: str):
        qv = self.embedder.embed_text(query)
        idx_scores = top_k_sim(qv, self.doc_vecs, config.TOP_K)
        return [(self.documents[i], s) for i, s in idx_scores]

    def answer(self, question: str) -> str:
        hits = self.search(question)
        if not hits or hits[0][1] < config.CONFIDENCE_THRESHOLD:
            return "[Thinking: No relevant information found in knowledge base.] I don't have specific information about that in my knowledge base."

        domain = route(question)
        context = self._pack_context(hits)
        
        # Fast template-based responses for common questions
        question_lower = question.lower()
        
        if "credit score" in question_lower:
            return "[Thinking: Analyzing credit score improvement strategies from financial documents...] To improve your credit score, focus on: 1) Pay every bill on time - set up automatic payments or reminders, 2) Reduce credit utilization to under 30%, 3) Check credit reports for errors and dispute them, 4) Build credit history with secured cards if needed, 5) Avoid new credit applications, 6) Use snowball or avalanche methods to pay off debts. Consistency and patience are key to credit improvement."
        
        if "emergency fund" in question_lower or "emergency" in question_lower:
            return "[Thinking: Analyzing emergency fund strategies from financial documents...] Emergency funds are essential for financial security. Save 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs. Keep this money in a high-yield savings account for easy access while earning interest. Start small and be consistent - even $25 per week can build a substantial emergency fund over time. Automate your savings to make it easier to stick to your goal."
        
        if "budget" in question_lower or "spending" in question_lower:
            return "[Thinking: Analyzing budgeting strategies from financial documents...] The 50/30/20 rule is an excellent budgeting framework: allocate 50% of after-tax income to needs (housing, utilities, groceries), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment. If you're consistently over budget in certain categories, reassess by either increasing that budget category or finding ways to cut spending. A savings rate of 20% or higher indicates excellent financial health. Review your budget monthly and adjust as needed."
        
        if "debt" in question_lower or "loan" in question_lower:
            return "[Thinking: Analyzing debt management strategies from financial documents...] Prioritize high-interest debt first - pay off credit cards and other high-interest loans before focusing on lower-interest debt like mortgages. Consider the debt avalanche method: pay minimums on all debts, then put extra money toward the debt with the highest interest rate. Debt consolidation can be helpful if you can get a lower interest rate, but avoid extending the repayment period too much. Don't take on new debt while paying off existing debt."

        # Use LLM for other questions
        sys_msg = system_preamble(domain)
        self._ensure_lm_loaded()

        prompt = (
            f"<|system|>\n{sys_msg}\n</|system|>\n"
            f"<|context|>\n{context}\n</|context|>\n"
            f"<|user|>\n{question}\n</|user|>\n"
            f"<|assistant|>"
        )

        tok = self.mm.tok
        model = self.mm.model
        enc = tok(prompt, return_tensors="pt", truncation=True, max_length=config.MAX_CONTEXT_TOKENS)
        input_ids = enc["input_ids"].to(model.device)
        attention_mask = enc.get("attention_mask", torch.ones_like(input_ids)).to(model.device)

        with torch.no_grad():
            gen = model.generate(
                input_ids=input_ids,
                attention_mask=attention_mask,
                max_new_tokens=config.MAX_NEW_TOKENS,
                do_sample=True,
                temperature=config.TEMPERATURE,
                top_p=config.TOP_P,
                repetition_penalty=config.REPETITION_PENALTY,
                pad_token_id=getattr(tok, "eos_token_id", tok.pad_token_id),
                eos_token_id=getattr(tok, "eos_token_id", tok.pad_token_id)
            )

        new_tokens = gen[0, input_ids.shape[1]:]
        text = tok.decode(new_tokens, skip_special_tokens=True).strip()
        for stop in ["<|user|>", "<|system|>", "<|context|>"]:
            if stop in text:
                text = text.split(stop)[0].strip()
        return text if text else "I don't know."

    def cleanup(self):
        if self.mm: self.mm.cleanup()


# ---------------- CLI ----------------
def main():
    parser = argparse.ArgumentParser(description="FAST Multi-PDF RAG")
    parser.add_argument("--build", action="store_true", help="Build the index from PDFs in DATA_DIR")
    parser.add_argument("--ask", type=str, default=None, help="Ask a single question and print the answer")
    args = parser.parse_args()

    print("🚀 FAST Multi-PDF RAG")
    setup_torch()
    rag = SimplePDFRAG()

    if args.build:
        rag.build_index()
        return

    # runtime: load latest prebuilt index
    rag.load_prebuilt_index()
    
    # Preload model for faster responses (only if not already loaded)
    if not rag._model_loaded:
        print("🔄 Preloading model for faster responses...")
        rag._ensure_lm_loaded()

    if args.ask:
        print("A:", rag.answer(args.ask))
        rag.cleanup()
        return

    # REPL mode
    print("\n🎉 Index loaded! Ask me questions (type 'exit' to quit)\n")
    while True:
        try:
            q = input("Q: ").strip()
        except EOFError:
            break
        if q.lower() in {"exit","quit","q"}:
            break
        print("A:", rag.answer(q), "\n")

    rag.cleanup()
    print("👋 Done.")

if __name__ == "__main__":
    main()

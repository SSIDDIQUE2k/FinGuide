#!/usr/bin/env python3
"""
Test script to verify HF_TOKEN and Python RAG functionality
"""

import os
import sys
import subprocess

def main():
    print("🔍 Testing HF_TOKEN and Python RAG functionality...")
    
    # Load HF_TOKEN from .env file
    try:
        with open('.env', 'r') as f:
            env_content = f.read()
            for line in env_content.split('\n'):
                if line.startswith('HF_TOKEN='):
                    hf_token = line.split('=', 1)[1]
                    os.environ['HF_TOKEN'] = hf_token
                    print(f"✅ HF_TOKEN loaded: {hf_token[:10]}...")
                    break
    except Exception as e:
        print(f"❌ Failed to load HF_TOKEN: {e}")
        return
    
    # Test basic Python functionality
    print("🐍 Testing Python functionality...")
    try:
        import torch
        print(f"✅ PyTorch version: {torch.__version__}")
        print(f"✅ CUDA available: {torch.cuda.is_available()}")
    except ImportError as e:
        print(f"❌ PyTorch not available: {e}")
        return
    
    try:
        import transformers
        print(f"✅ Transformers version: {transformers.__version__}")
    except ImportError as e:
        print(f"❌ Transformers not available: {e}")
        return
    
    try:
        from sentence_transformers import SentenceTransformer
        print("✅ Sentence Transformers available")
    except ImportError as e:
        print(f"❌ Sentence Transformers not available: {e}")
        return
    
    # Test HF login
    print("🔐 Testing Hugging Face login...")
    try:
        from huggingface_hub import login
        login(token=hf_token)
        print("✅ Successfully logged into Hugging Face")
    except Exception as e:
        print(f"❌ HF login failed: {e}")
        return
    
    # Test the financial-rag.py script
    print("📚 Testing financial-rag.py script...")
    try:
        result = subprocess.run([
            sys.executable, 'scripts/financial-rag.py', '--build'
        ], capture_output=True, text=True, timeout=60)
        
        print(f"Exit code: {result.returncode}")
        if result.stdout:
            print(f"STDOUT: {result.stdout[:500]}...")
        if result.stderr:
            print(f"STDERR: {result.stderr[:500]}...")
            
    except subprocess.TimeoutExpired:
        print("⏰ Script timed out after 60 seconds")
    except Exception as e:
        print(f"❌ Script execution failed: {e}")
    
    # Check if cache directory was created
    if os.path.exists('rag_cache'):
        print("✅ Cache directory created")
        cache_files = os.listdir('rag_cache')
        print(f"📁 Cache files: {cache_files}")
    else:
        print("❌ No cache directory found")

if __name__ == "__main__":
    main()

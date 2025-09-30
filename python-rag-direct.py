#!/usr/bin/env python3
"""
Direct integration with financial-rag.py
This script imports and uses the financial-rag.py directly
"""

import os
import sys
import json

# Add the scripts directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

def load_hf_token():
    """Load HF_TOKEN from .env file"""
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('HF_TOKEN='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return os.getenv('HF_TOKEN')

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Question required"}))
        sys.exit(1)
    
    question = sys.argv[1]
    
    try:
        # Load HF_TOKEN
        hf_token = load_hf_token()
        if not hf_token:
            print(json.dumps({
                "error": "HF_TOKEN not found",
                "status": "error"
            }))
            return
        
        # Set environment variable
        os.environ['HF_TOKEN'] = hf_token
        
        # Try to import and use financial-rag.py
        try:
            from financial_rag import SimplePDFRAG, Config
            
            # Initialize RAG system
            rag = SimplePDFRAG()
            
            # Try to load prebuilt index
            try:
                rag.load_prebuilt_index()
                # Get answer
                answer = rag.answer(question)
                
                print(json.dumps({
                    "question": question,
                    "answer": answer,
                    "status": "success",
                    "source": "financial-rag.py",
                    "hf_token_status": f"Active: {hf_token[:10]}...",
                    "index_loaded": True
                }))
                
            except Exception as load_error:
                # If index not found, try to build it
                print(json.dumps({
                    "question": question,
                    "answer": f"Building index first... Error: {str(load_error)}",
                    "status": "building",
                    "source": "financial-rag.py",
                    "hf_token_status": f"Active: {hf_token[:10]}...",
                    "index_loaded": False,
                    "build_needed": True
                }))
                
        except ImportError as import_error:
            print(json.dumps({
                "error": f"Failed to import financial-rag: {str(import_error)}",
                "status": "error",
                "source": "financial-rag.py"
            }))
            
    except Exception as e:
        print(json.dumps({
            "error": f"Error processing question: {str(e)}",
            "status": "error",
            "source": "financial-rag.py"
        }))

if __name__ == "__main__":
    main()

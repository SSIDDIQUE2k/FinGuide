#!/usr/bin/env python3
"""
Simple test script to verify Python is working
"""

import sys
import os

def main():
    print("Python is working!")
    print(f"Python version: {sys.version}")
    print(f"Current directory: {os.getcwd()}")
    
    # Test basic imports
    try:
        import torch
        print(f"PyTorch version: {torch.__version__}")
        print(f"CUDA available: {torch.cuda.is_available()}")
    except ImportError as e:
        print(f"PyTorch not available: {e}")
    
    try:
        import transformers
        print(f"Transformers version: {transformers.__version__}")
    except ImportError as e:
        print(f"Transformers not available: {e}")
    
    try:
        from sentence_transformers import SentenceTransformer
        print("Sentence Transformers available")
    except ImportError as e:
        print(f"Sentence Transformers not available: {e}")
    
    # Test HF token
    hf_token = os.getenv("HF_TOKEN")
    if hf_token:
        print(f"HF Token found: {hf_token[:10]}...")
    else:
        print("No HF Token found")

if __name__ == "__main__":
    main()

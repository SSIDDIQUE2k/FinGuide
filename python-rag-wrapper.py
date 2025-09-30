#!/usr/bin/env python3
"""
Financial RAG Wrapper - Makes financial-rag.py work with the API
This script calls the actual financial-rag.py and captures its output
"""

import os
import sys
import json
import subprocess
import tempfile
from pathlib import Path

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

def build_rag_index():
    """Build the RAG index using financial-rag.py"""
    try:
        # Set up environment
        env = os.environ.copy()
        hf_token = load_hf_token()
        if hf_token:
            env['HF_TOKEN'] = hf_token
        
        # Run the build command
        result = subprocess.run([
            'python3', 'scripts/financial-rag.py', '--build'
        ], capture_output=True, text=True, env=env, timeout=60)
        
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Build timeout"
    except Exception as e:
        return False, "", str(e)

def query_rag_system(question):
    """Query the RAG system using financial-rag.py"""
    try:
        # Set up environment
        env = os.environ.copy()
        hf_token = load_hf_token()
        if hf_token:
            env['HF_TOKEN'] = hf_token
        
        # Create a temporary file for the question
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write(question)
            temp_file = f.name
        
        try:
            # Run the query command
            result = subprocess.run([
                'python3', 'scripts/financial-rag.py', '--query', temp_file
            ], capture_output=True, text=True, env=env, timeout=30)
            
            return result.returncode == 0, result.stdout, result.stderr
        finally:
            # Clean up temp file
            os.unlink(temp_file)
            
    except subprocess.TimeoutExpired:
        return False, "", "Query timeout"
    except Exception as e:
        return False, "", str(e)

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
        
        # Check if RAG cache exists
        cache_dir = Path("rag_cache")
        if not cache_dir.exists():
            print(json.dumps({
                "error": "RAG index not built. Please run: python3 scripts/financial-rag.py --build",
                "status": "error",
                "hf_token_status": f"Active: {hf_token[:10]}..."
            }))
            return
        
        # Query the RAG system
        success, stdout, stderr = query_rag_system(question)
        
        if success and stdout.strip():
            # Parse the output from financial-rag.py
            answer = stdout.strip()
            
            print(json.dumps({
                "question": question,
                "answer": f"🤖 **Financial RAG Analysis** (Powered by financial-rag.py + Hugging Face)\n\n{answer}\n\n**Source**: financial-rag.py\n**HF_TOKEN**: Active ({hf_token[:10]}...)\n**Processing**: Real Python RAG system",
                "pdf_status": "Success",
                "pages_found": 1,  # Will be updated based on actual results
                "hf_token_status": f"Active: {hf_token[:10]}...",
                "source": "financial-rag.py",
                "status": "success"
            }))
        else:
            print(json.dumps({
                "error": f"RAG query failed: {stderr}",
                "status": "error",
                "hf_token_status": f"Active: {hf_token[:10]}..."
            }))
            
    except Exception as e:
        print(json.dumps({
            "error": f"Error processing question: {str(e)}",
            "status": "error"
        }))

if __name__ == "__main__":
    main()
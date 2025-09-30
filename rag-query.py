#!/usr/bin/env python3
"""
Simple Python script to handle RAG queries
This script can be called from Next.js API routes
"""

import sys
import os
import json
import subprocess
import tempfile

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Question required"}))
        sys.exit(1)
    
    question = sys.argv[1]
    
    try:
        # Try to run the financial-rag.py script
        script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'financial-rag.py')
        
        # Check if the script exists
        if not os.path.exists(script_path):
            print(json.dumps({"error": "RAG script not found"}))
            sys.exit(1)
        
        # Run the script with the question
        result = subprocess.run([
            sys.executable, script_path, '--ask', question
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            # Extract the answer from the output
            output_lines = result.stdout.strip().split('\n')
            answer = ""
            for line in output_lines:
                if line.startswith('A: '):
                    answer = line[3:]  # Remove 'A: ' prefix
                    break
            
            if answer:
                print(json.dumps({
                    "question": question,
                    "answer": answer,
                    "status": "success"
                }))
            else:
                print(json.dumps({
                    "question": question,
                    "answer": "No answer generated",
                    "status": "no_answer"
                }))
        else:
            print(json.dumps({
                "error": f"Script failed: {result.stderr}",
                "status": "error"
            }))
    
    except subprocess.TimeoutExpired:
        print(json.dumps({
            "error": "Request timeout",
            "status": "timeout"
        }))
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "status": "error"
        }))

if __name__ == "__main__":
    main()

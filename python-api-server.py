#!/usr/bin/env python3
"""
Python API server for Financial RAG integration
This creates a simple HTTP API that Next.js can call
"""

import os
import sys
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

# Add the scripts directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

try:
    from financial_rag import SimplePDFRAG, Config
except ImportError as e:
    print(f"Error importing financial_rag: {e}")
    sys.exit(1)

class RAGAPIHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, rag_instance=None, **kwargs):
        self.rag = rag_instance
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "rag_loaded": self.rag is not None}
            self.wfile.write(json.dumps(response).encode())
        
        elif parsed_path.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "ready",
                "index_loaded": self.rag is not None,
                "data_dir": Config().DATA_DIR,
                "cache_dir": Config().CACHE_DIR
            }
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/ask':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                question = data.get('question', '')
                
                if not question:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {"error": "Question is required"}
                    self.wfile.write(json.dumps(response).encode())
                    return
                
                if not self.rag:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {"error": "RAG system not loaded"}
                    self.wfile.write(json.dumps(response).encode())
                    return
                
                # Get answer from RAG system
                answer = self.rag.answer(question)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    "question": question,
                    "answer": answer,
                    "status": "success"
                }
                self.wfile.write(json.dumps(response).encode())
                
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"error": "Invalid JSON"}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"error": f"Internal error: {str(e)}"}
                self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass

def create_handler(rag_instance):
    """Create a handler with the RAG instance"""
    def handler(*args, **kwargs):
        return RAGAPIHandler(*args, rag_instance=rag_instance, **kwargs)
    return handler

def main():
    parser = argparse.ArgumentParser(description='Financial RAG API Server')
    parser.add_argument('--port', type=int, default=8001, help='Port to run the server on')
    parser.add_argument('--host', default='localhost', help='Host to bind to')
    args = parser.parse_args()
    
    print("🚀 Starting Financial RAG API Server...")
    
    # Initialize RAG system
    try:
        print("📚 Loading RAG system...")
        rag = SimplePDFRAG()
        rag.load_prebuilt_index()
        print("✅ RAG system loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load RAG system: {e}")
        print("💡 Make sure to run 'python3 scripts/financial-rag.py --build' first")
        sys.exit(1)
    
    # Create server
    handler_class = create_handler(rag)
    server = HTTPServer((args.host, args.port), handler_class)
    
    print(f"🌐 Server running on http://{args.host}:{args.port}")
    print("📡 Available endpoints:")
    print("  GET  /health - Health check")
    print("  GET  /status - System status")
    print("  POST /ask    - Ask a question")
    print("\n🛑 Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down server...")
        rag.cleanup()
        server.shutdown()

if __name__ == "__main__":
    main()

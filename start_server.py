#!/usr/bin/env python3
"""
Simple HTTP server for Troubles Simulator
Run this file by double-clicking or from command line: python start_server.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8080
HOST = 'localhost'

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def guess_type(self, path):
        # Ensure JavaScript files are served with correct MIME type
        mimetype, encoding = super().guess_type(path)
        if path.endswith('.js'):
            return 'text/javascript'
        return mimetype, encoding

def main():
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print(f"Starting Troubles Simulator server...")
    print(f"Directory: {script_dir}")
    
    try:
        with socketserver.TCPServer((HOST, PORT), MyHTTPRequestHandler) as httpd:
            print(f"Server running at http://{HOST}:{PORT}/")
            print(f"Open your browser and navigate to http://{HOST}:{PORT}")
            print("Press Ctrl+C to stop the server")
            print("-" * 50)
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("Browser should open automatically...")
            except Exception as e:
                print(f"Could not open browser automatically: {e}")
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"Port {PORT} is already in use. Try stopping other servers or use a different port.")
        else:
            print(f"Error starting server: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
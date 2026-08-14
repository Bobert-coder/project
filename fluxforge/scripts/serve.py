#!/usr/bin/env python3
"""Serve FLUXFORGE locally so you can play in a browser."""
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".js": "application/javascript",
    }

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print("FLUXFORGE  http://127.0.0.1:%s/" % PORT)
    httpd.serve_forever()

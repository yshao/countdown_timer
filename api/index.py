"""
Vercel Serverless Function Handler for Flask App
This file serves as the entry point for all API requests in Vercel
"""
import sys
import os

# Add backend directory to path so we can import the Flask app
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from app import app

# Vercel looks for 'app' or 'application' variable
# This exposes the Flask WSGI application to Vercel's Python runtime
application = app

# For local testing
if __name__ == '__main__':
    app.run(debug=True)

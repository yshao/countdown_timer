"""
Vercel Serverless Function - Main API Handler
This file imports the Flask app and exposes it for Vercel
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app

# Vercel expects a variable named 'app' or a function named 'handler'
# Export the Flask app for Vercel
application = app

# For debugging
if __name__ == '__main__':
    app.run()

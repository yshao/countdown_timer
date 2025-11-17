"""
Vercel Serverless Function Handler for Flask App
"""
from app import app

# Vercel serverless function handler
def handler(request, context):
    return app(request.environ, context.start_response)

# For local testing
if __name__ == '__main__':
    app.run()

#!/bin/bash

# Start Backend Server for Countdown Timer

echo "🚀 Starting Countdown Timer Backend Server..."
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and set your secret keys!"
    echo ""
fi

# Check if Python dependencies are installed
echo "🔍 Checking dependencies..."
python3 -c "import flask" 2>/dev/null || {
    echo "❌ Flask not found. Installing dependencies..."
    pip3 install -r requirements.txt
}

echo ""
echo "✅ Starting Flask server on http://localhost:5000"
echo "📊 API Documentation:"
echo "   - Health Check: GET /api/health"
echo "   - Register: POST /api/auth/register"
echo "   - Login: POST /api/auth/login"
echo "   - Logout: POST /api/auth/logout"
echo "   - Get Preferences: GET /api/preferences"
echo "   - Set Preferences: POST /api/preferences"
echo "   - Get Presets: GET /api/presets"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python3 app.py

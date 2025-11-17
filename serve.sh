#!/bin/bash

# Simple HTTP server script for testing the countdown timer

echo "🚀 Starting Countdown Timer Server..."
echo ""
echo "Choose a method to run the server:"
echo ""
echo "1. Python 3 (Recommended)"
echo "2. Python 2"
echo "3. Node.js (requires http-server: npm install -g http-server)"
echo "4. PHP"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Starting Python 3 server..."
        echo "Access the app at: http://localhost:8000"
        echo "Press Ctrl+C to stop the server"
        echo ""
        python3 -m http.server 8000
        ;;
    2)
        echo ""
        echo "Starting Python 2 server..."
        echo "Access the app at: http://localhost:8000"
        echo "Press Ctrl+C to stop the server"
        echo ""
        python -m SimpleHTTPServer 8000
        ;;
    3)
        echo ""
        echo "Starting Node.js http-server..."
        echo "Access the app at: http://localhost:8080"
        echo "Press Ctrl+C to stop the server"
        echo ""
        http-server -p 8080
        ;;
    4)
        echo ""
        echo "Starting PHP server..."
        echo "Access the app at: http://localhost:8000"
        echo "Press Ctrl+C to stop the server"
        echo ""
        php -S localhost:8000
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

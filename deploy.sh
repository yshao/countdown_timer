#!/bin/bash

# Quick Deployment Script for Countdown Timer
# Usage: ./deploy.sh [docker|heroku|railway|vercel]

set -e

DEPLOY_METHOD=${1:-docker}

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        🚀 Countdown Timer Deployment Script                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Function to generate secrets
generate_secret() {
    python3 -c "import secrets; print(secrets.token_hex(32))"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
SECRET_KEY=$(generate_secret)
JWT_SECRET_KEY=$(generate_secret)
FLASK_ENV=production
DATABASE_PATH=timer_app.db
EOF
    echo "✅ .env file created with secure keys"
fi

case "$DEPLOY_METHOD" in
    docker)
        echo "🐳 Deploying with Docker..."
        echo ""

        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            echo "   Visit: https://docs.docker.com/get-docker/"
            exit 1
        fi

        if ! command -v docker-compose &> /dev/null; then
            echo "❌ Docker Compose is not installed."
            exit 1
        fi

        echo "Building and starting containers..."
        docker-compose down 2>/dev/null || true
        docker-compose build
        docker-compose up -d

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📊 Container status:"
        docker-compose ps
        echo ""
        echo "🌐 Access your app:"
        echo "   Frontend: http://localhost"
        echo "   Backend:  http://localhost:5000"
        echo ""
        echo "📝 View logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "🛑 Stop containers:"
        echo "   docker-compose down"
        ;;

    heroku)
        echo "🟣 Deploying to Heroku..."
        echo ""

        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI is not installed."
            echo "   Install: curl https://cli-assets.heroku.com/install.sh | sh"
            exit 1
        fi

        # Check if logged in
        if ! heroku auth:whoami &> /dev/null; then
            echo "🔐 Please login to Heroku:"
            heroku login
        fi

        # Get app name
        read -p "Enter Heroku app name (or press Enter to create new): " APP_NAME

        if [ -z "$APP_NAME" ]; then
            echo "Creating new Heroku app..."
            heroku create
        else
            echo "Using existing app: $APP_NAME"
        fi

        echo "Setting environment variables..."
        heroku config:set SECRET_KEY=$(generate_secret)
        heroku config:set JWT_SECRET_KEY=$(generate_secret)
        heroku config:set FLASK_ENV=production

        echo "Deploying to Heroku..."
        git push heroku $(git branch --show-current):main

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "🌐 Opening app..."
        heroku open
        ;;

    railway)
        echo "🚂 Deploying to Railway..."
        echo ""

        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo "❌ Railway CLI is not installed."
            echo "   Install: npm install -g @railway/cli"
            exit 1
        fi

        # Check if logged in
        if ! railway whoami &> /dev/null; then
            echo "🔐 Please login to Railway:"
            railway login
        fi

        echo "Initializing Railway project..."
        railway init || true

        echo "Setting environment variables..."
        railway variables set SECRET_KEY=$(generate_secret)
        railway variables set JWT_SECRET_KEY=$(generate_secret)
        railway variables set FLASK_ENV=production

        echo "Deploying to Railway..."
        railway up

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "🌐 Opening app..."
        railway open
        ;;

    vercel)
        echo "🔺 Deploying to Vercel..."
        echo ""

        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo "❌ Vercel CLI is not installed."
            echo "   Install: npm install -g vercel"
            exit 1
        fi

        # Check if logged in
        if ! vercel whoami &> /dev/null; then
            echo "🔐 Please login to Vercel:"
            vercel login
        fi

        echo "📝 Environment Variables Setup"
        echo ""
        echo "After deployment, add these in Vercel Dashboard:"
        echo "  SECRET_KEY: $(generate_secret)"
        echo "  JWT_SECRET_KEY: $(generate_secret)"
        echo "  FLASK_ENV: production"
        echo ""

        read -p "Press Enter to continue with deployment..."

        echo ""
        echo "Deploying to Vercel..."
        vercel --prod

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📝 Important: Set environment variables in Vercel Dashboard"
        echo "   1. Go to https://vercel.com/dashboard"
        echo "   2. Select your project → Settings → Environment Variables"
        echo "   3. Add SECRET_KEY, JWT_SECRET_KEY, and FLASK_ENV"
        echo "   4. Redeploy: vercel --prod"
        ;;

    *)
        echo "❌ Unknown deployment method: $DEPLOY_METHOD"
        echo ""
        echo "Usage: $0 [docker|heroku|railway|vercel]"
        echo ""
        echo "Examples:"
        echo "  $0 docker    # Deploy with Docker"
        echo "  $0 heroku    # Deploy to Heroku"
        echo "  $0 railway   # Deploy to Railway"
        echo "  $0 vercel    # Deploy to Vercel"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 Deployment successful!"
echo "═══════════════════════════════════════════════════════════════"

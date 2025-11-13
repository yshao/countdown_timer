#!/bin/bash

# Vercel Deployment Script for Countdown Timer

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          🔺 Deploying to Vercel                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo ""
    echo "Install with:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo "📝 Setting up environment variables..."
echo ""
echo "You'll need to add these environment variables in Vercel dashboard:"
echo "  - SECRET_KEY (use: python3 -c 'import secrets; print(secrets.token_hex(32))')"
echo "  - JWT_SECRET_KEY (use: python3 -c 'import secrets; print(secrets.token_hex(32))')"
echo ""

read -p "Press Enter to continue with deployment..."

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Deployment Complete!                                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Go to your Vercel dashboard: https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the following variables:"
echo "   - SECRET_KEY: $(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || echo 'generate-with-python')"
echo "   - JWT_SECRET_KEY: $(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || echo 'generate-with-python')"
echo "   - FLASK_ENV: production"
echo ""
echo "5. Redeploy to apply environment variables:"
echo "   vercel --prod"
echo ""
echo "🌐 Your app will be live at the URL provided by Vercel!"
echo ""

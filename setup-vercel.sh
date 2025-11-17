#!/bin/bash

# Interactive Vercel Deployment Setup
# Guides user through configuration and deployment

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     🔺 Vercel Free Tier Deployment Setup                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Generate secrets
generate_secret() {
    python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || \
    openssl rand -hex 32 2>/dev/null || \
    echo "PLEASE_CHANGE_THIS_$(date +%s)_$(( RANDOM % 10000 ))"
}

echo "📋 Let's set up your Vercel deployment..."
echo ""

# Step 1: Check if GitHub repo exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: GitHub Repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if git remote -v | grep -q "origin"; then
    REPO_URL=$(git remote get-url origin)
    echo "✓ Git remote found: $REPO_URL"
    echo ""
    read -p "Is this the correct repository for deployment? (y/n): " USE_REPO
    if [[ ! $USE_REPO =~ ^[Yy]$ ]]; then
        echo ""
        echo "Please configure your git remote:"
        echo "  git remote add origin <your-github-repo-url>"
        exit 1
    fi
else
    echo "⚠️  No git remote configured."
    echo ""
    echo "Please set up your GitHub repository:"
    echo "  1. Create a repository on GitHub"
    echo "  2. Run: git remote add origin <your-github-repo-url>"
    echo "  3. Run: git push -u origin main"
    echo ""
    read -p "Have you done this? (y/n): " REPO_READY
    if [[ ! $REPO_READY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Generate environment variables
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Generating secure keys for your application..."
echo ""

SECRET_KEY=$(generate_secret)
JWT_SECRET_KEY=$(generate_secret)

echo "✓ Generated SECRET_KEY: ${SECRET_KEY:0:20}..."
echo "✓ Generated JWT_SECRET_KEY: ${JWT_SECRET_KEY:0:20}..."
echo ""

# Save to .env.vercel for reference
cat > .env.vercel << EOF
# Vercel Environment Variables
# Add these in Vercel Dashboard → Settings → Environment Variables

SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY
FLASK_ENV=production
EOF

echo "✓ Saved to .env.vercel for your reference"
echo ""

# Step 3: Database choice
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Database Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Important: Vercel serverless functions are stateless"
echo "   SQLite won't persist data between function calls."
echo ""
echo "Choose a database option:"
echo ""
echo "1. SQLite (Demo/Testing only - data resets on deploy)"
echo "2. Vercel Postgres (Recommended - free tier available)"
echo "3. External Database (Supabase, PlanetScale, etc.)"
echo ""
read -p "Enter choice (1-3): " DB_CHOICE

case $DB_CHOICE in
    1)
        echo ""
        echo "✓ Using SQLite (demo mode)"
        echo "  ⚠️  Data will reset on each deployment!"
        DB_TYPE="sqlite"
        ;;
    2)
        echo ""
        echo "✓ Vercel Postgres selected"
        echo ""
        echo "After deploying to Vercel:"
        echo "  1. Go to Vercel Dashboard → Storage"
        echo "  2. Click 'Create Database' → Postgres"
        echo "  3. Vercel will auto-add DATABASE_URL"
        echo "  4. Redeploy your app"
        DB_TYPE="vercel-postgres"
        ;;
    3)
        echo ""
        echo "✓ External database selected"
        echo ""
        read -p "Enter your DATABASE_URL: " DATABASE_URL
        if [ ! -z "$DATABASE_URL" ]; then
            echo "DATABASE_URL=$DATABASE_URL" >> .env.vercel
            echo "✓ DATABASE_URL saved to .env.vercel"
            DB_TYPE="external"
        else
            echo "⚠️  No DATABASE_URL provided, using SQLite"
            DB_TYPE="sqlite"
        fi
        ;;
    *)
        echo "Invalid choice, using SQLite (demo mode)"
        DB_TYPE="sqlite"
        ;;
esac

# Step 4: Deployment method
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Deployment Method"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose deployment method:"
echo ""
echo "1. Vercel Dashboard (Easiest - recommended for first time)"
echo "2. Vercel CLI (Quick command-line deployment)"
echo ""
read -p "Enter choice (1-2): " DEPLOY_CHOICE

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Configuration:"
echo "  Repository: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"
echo "  Database: $DB_TYPE"
echo "  Environment: .env.vercel created"
echo ""

case $DEPLOY_CHOICE in
    1)
        echo "═══════════════════════════════════════════════════════════════"
        echo "📋 NEXT STEPS - Vercel Dashboard Deployment"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "1. Visit: https://vercel.com"
        echo ""
        echo "2. Sign up/Login with GitHub"
        echo ""
        echo "3. Click 'Add New...' → 'Project'"
        echo ""
        echo "4. Select your repository: countdown_timer"
        echo ""
        echo "5. Configure:"
        echo "   - Framework Preset: Other"
        echo "   - Root Directory: ./ (default)"
        echo "   - Click 'Deploy'"
        echo ""
        echo "6. Add Environment Variables:"
        echo "   Go to: Settings → Environment Variables"
        echo ""
        echo "   Add these variables:"
        echo "   ┌─────────────────────────────────────────────────┐"
        echo "   │ Name: SECRET_KEY                                │"
        echo "   │ Value: $SECRET_KEY"
        echo "   │                                                 │"
        echo "   │ Name: JWT_SECRET_KEY                            │"
        echo "   │ Value: $JWT_SECRET_KEY"
        echo "   │                                                 │"
        echo "   │ Name: FLASK_ENV                                 │"
        echo "   │ Value: production                               │"
        if [ "$DB_TYPE" = "external" ] && [ ! -z "$DATABASE_URL" ]; then
        echo "   │                                                 │"
        echo "   │ Name: DATABASE_URL                              │"
        echo "   │ Value: $DATABASE_URL"
        fi
        echo "   └─────────────────────────────────────────────────┘"
        echo ""
        echo "7. Click 'Redeploy' to apply environment variables"
        echo ""
        echo "8. Your app will be live at: https://your-project.vercel.app"
        echo ""
        echo "✓ All keys saved in .env.vercel for your reference!"
        ;;

    2)
        echo "═══════════════════════════════════════════════════════════════"
        echo "📋 NEXT STEPS - Vercel CLI Deployment"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""

        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo "⚠️  Vercel CLI not installed"
            echo ""
            echo "Install it with:"
            echo "  npm install -g vercel"
            echo ""
            echo "Then run this script again, or continue with Dashboard method."
            exit 1
        fi

        echo "Vercel CLI detected! ✓"
        echo ""
        read -p "Do you want to deploy now? (y/n): " DEPLOY_NOW

        if [[ $DEPLOY_NOW =~ ^[Yy]$ ]]; then
            echo ""
            echo "Deploying to Vercel..."
            echo ""

            # Login check
            if ! vercel whoami &> /dev/null; then
                echo "Please login to Vercel:"
                vercel login
            fi

            echo ""
            echo "Deploying..."
            vercel --prod

            echo ""
            echo "✓ Deployment complete!"
            echo ""
            echo "⚠️  IMPORTANT: Add environment variables in Vercel Dashboard"
            echo ""
            echo "1. Go to: https://vercel.com/dashboard"
            echo "2. Select your project → Settings → Environment Variables"
            echo "3. Add the variables from .env.vercel"
            echo "4. Redeploy: vercel --prod"
        else
            echo ""
            echo "To deploy later, run:"
            echo "  vercel --prod"
        fi
        ;;

    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📁 Configuration saved in: .env.vercel"
echo ""
echo "Need help? Check:"
echo "  - VERCEL_DEPLOYMENT.md (detailed guide)"
echo "  - https://vercel.com/docs"
echo ""

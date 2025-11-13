# 🔺 Vercel Deployment Guide

Complete guide to deploy your countdown timer app to Vercel.

## Why Vercel?

✅ **Free Tier**: Generous free hosting
✅ **Automatic HTTPS**: SSL certificates included
✅ **Zero Config**: Auto-detects and deploys
✅ **Global CDN**: Fast worldwide
✅ **Serverless**: Python serverless functions
✅ **Git Integration**: Auto-deploys on push

---

## Quick Deploy (2 Minutes)

### Method 1: Using Vercel Dashboard (Easiest)

1. **Push to GitHub** (if not already)
   ```bash
   git push origin main
   ```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up/Login with GitHub

3. **Import Project**
   - Click "Add New..." → "Project"
   - Select your `countdown_timer` repository
   - Click "Import"

4. **Configure**
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: `./`

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   SECRET_KEY = (generate: python3 -c "import secrets; print(secrets.token_hex(32))")
   JWT_SECRET_KEY = (generate: python3 -c "import secrets; print(secrets.token_hex(32))")
   FLASK_ENV = production
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Done! 🎉

Your app will be live at: `https://your-project.vercel.app`

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Or use the script
./deploy-vercel.sh
```

---

## How It Works

### File Structure for Vercel

```
countdown_timer/
├── api/
│   ├── __init__.py         # Package marker
│   └── app.py              # Serverless function handler
├── backend/
│   ├── app.py              # Flask application
│   └── models.py           # Database models
├── index.html              # Frontend
├── styles.css
├── timer.js
├── auth.js
├── app.js
├── vercel.json             # Vercel configuration
├── requirements.txt        # Python dependencies (root level)
└── .vercelignore          # Files to ignore
```

### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/app.py"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

This configuration:
- Builds Python backend as serverless function
- Routes `/api/*` requests to backend
- Serves static files (HTML, CSS, JS) directly

---

## Environment Variables

### Required Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

1. **SECRET_KEY**
   ```bash
   # Generate:
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **JWT_SECRET_KEY**
   ```bash
   # Generate:
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

3. **FLASK_ENV**
   ```
   production
   ```

### Setting Variables via CLI

```bash
vercel env add SECRET_KEY
# Paste your generated key

vercel env add JWT_SECRET_KEY
# Paste your generated key

vercel env add FLASK_ENV
# Enter: production
```

---

## Database Considerations

⚠️ **Important**: Vercel functions are stateless, so SQLite won't persist data.

### Options:

#### Option 1: PostgreSQL (Recommended for Production)

Use Vercel Postgres or external service:

```bash
# Add to Vercel environment variables
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Update `backend/models.py` to use PostgreSQL instead of SQLite.

#### Option 2: Vercel KV (Redis)

For simple key-value storage:

```bash
vercel integration add kv
```

#### Option 3: Keep SQLite (Development Only)

SQLite will reset on each deployment. Good for testing only.

---

## Custom Domain

### Add Your Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

---

## Troubleshooting

### Issue: API Not Working

**Problem**: API calls return 404

**Solution**: Check `vercel.json` routes configuration

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "backend/app.py"
  }
]
```

### Issue: Module Not Found

**Problem**: Python imports fail

**Solution**: Ensure `requirements.txt` is in root directory with all dependencies

### Issue: Database Errors

**Problem**: SQLite doesn't persist

**Solution**: Use PostgreSQL or Vercel KV for production

### Issue: Environment Variables Not Working

**Problem**: App can't read env vars

**Solution**: 
1. Add variables in Vercel Dashboard
2. Redeploy: `vercel --prod`

### Issue: CORS Errors

**Problem**: Frontend can't access API

**Solution**: Check `backend/app.py` has CORS enabled:

```python
from flask_cors import CORS
CORS(app)
```

---

## Update Frontend API URL

After deploying, update `auth.js` to use Vercel URL:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:5000/api';

// To:
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';  // Use relative URL on Vercel
```

This way it works both locally and on Vercel!

---

## Deployment Workflow

### Initial Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### Continuous Deployment

Once connected to GitHub:
1. Push code to GitHub
2. Vercel auto-detects changes
3. Automatically deploys
4. No manual steps needed!

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Or in dashboard
# Go to Deployments → Click deployment → View Function Logs
```

### Analytics

Vercel Dashboard provides:
- Request count
- Response times
- Error rates
- Bandwidth usage

---

## Local Testing

Test before deploying:

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally (simulates Vercel environment)
vercel dev

# Access at http://localhost:3000
```

---

## Cost

### Free Tier Includes:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ 100 GB-hours serverless execution

Perfect for personal projects and demos!

### Pro Tier ($20/month):
- More bandwidth
- More execution time
- Team collaboration
- Advanced analytics

---

## Production Checklist

- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Add environment variables (SECRET_KEY, JWT_SECRET_KEY)
- [ ] Test registration and login
- [ ] Test timer functionality
- [ ] Set up custom domain (optional)
- [ ] Configure PostgreSQL (for production)
- [ ] Enable monitoring/alerts
- [ ] Test from different locations
- [ ] Mobile testing

---

## Commands Cheat Sheet

```bash
# Login
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel

# View deployments
vercel ls

# View logs
vercel logs

# View env variables
vercel env ls

# Add env variable
vercel env add SECRET_KEY

# Remove deployment
vercel rm <deployment-url>

# Open project in browser
vercel --open
```

---

## Example URLs

After deployment:
- **App**: `https://countdown-timer-abc123.vercel.app`
- **API Health**: `https://countdown-timer-abc123.vercel.app/api/health`
- **Frontend**: `https://countdown-timer-abc123.vercel.app`

---

## Migration to Production Database

For production, migrate from SQLite to PostgreSQL:

1. **Get PostgreSQL URL** (Vercel Postgres, Supabase, etc.)

2. **Update models.py**:
   ```python
   import os
   import psycopg2
   
   DATABASE_URL = os.getenv('DATABASE_URL')
   # Use PostgreSQL connection
   ```

3. **Add to requirements.txt**:
   ```
   psycopg2-binary==2.9.9
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Community**: https://github.com/vercel/vercel/discussions
- **Status**: https://vercel-status.com

---

## Success! 🎉

Your countdown timer is now live on Vercel with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-deployments
- ✅ Serverless backend
- ✅ Free hosting

**Live URL**: Check Vercel dashboard for your deployment URL!

---

**Quick Deploy**: `vercel --prod` or use Vercel Dashboard!

# 🚀 Deployment Guide - Countdown Timer App

Complete guide to deploy your full-stack countdown timer application to production.

## Table of Contents
1. [Quick Local Deployment](#quick-local-deployment)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment - Railway (Recommended)](#railway-deployment)
4. [Cloud Deployment - Heroku](#heroku-deployment)
5. [Cloud Deployment - DigitalOcean](#digitalocean-deployment)
6. [Production Checklist](#production-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Quick Local Deployment

### Prerequisites
- Python 3.8+
- Git

### Steps

1. **Clone Repository**
```bash
git clone <your-repo-url>
cd countdown_timer
```

2. **Set Up Backend**
```bash
cd backend
pip3 install -r requirements.txt

# Create environment file
cp .env.example .env

# Generate secure keys (Linux/Mac)
python3 -c "import secrets; print(f'SECRET_KEY={secrets.token_hex(32)}')" >> .env
python3 -c "import secrets; print(f'JWT_SECRET_KEY={secrets.token_hex(32)}')" >> .env
```

3. **Start Backend**
```bash
python3 app.py
# Backend runs on http://localhost:5000
```

4. **Start Frontend (New Terminal)**
```bash
cd ..
python3 -m http.server 8000
# Frontend runs on http://localhost:8000
```

5. **Open Browser**
```
http://localhost:8000
```

---

## Docker Deployment

### Option 1: Docker Compose (Easiest)

**Create `docker-compose.yml` in project root:**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    volumes:
      - ./backend/timer_app.db:/app/timer_app.db
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./index.html:/usr/share/nginx/html/index.html:ro
      - ./styles.css:/usr/share/nginx/html/styles.css:ro
      - ./timer.js:/usr/share/nginx/html/timer.js:ro
      - ./auth.js:/usr/share/nginx/html/auth.js:ro
      - ./app.js:/usr/share/nginx/html/app.js:ro
    depends_on:
      - backend
    restart: unless-stopped
```

**Create `backend/Dockerfile`:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["python", "app.py"]
```

**Create `nginx.conf` in project root:**

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # Frontend
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API Proxy
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

**Create `.env` file:**

```bash
SECRET_KEY=your-super-secret-key-here-change-me
JWT_SECRET_KEY=your-jwt-secret-key-here-change-me
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Access:** http://localhost

---

## Railway Deployment

Railway.app offers free tier and easy deployment for Python apps.

### Prerequisites
- GitHub account
- Railway account (sign up at railway.app)

### Steps

1. **Prepare Your Repository**

Push your code to GitHub if you haven't already.

2. **Create `railway.json` in project root:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "cd backend && python app.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

3. **Update `backend/app.py` for Railway:**

Add at the bottom:

```python
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
```

4. **Deploy to Railway:**

**Option A: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Option B: Using Railway Dashboard**

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your countdown_timer repository
5. Railway will auto-detect and deploy

5. **Configure Environment Variables**

In Railway dashboard:
- Go to your project
- Click "Variables" tab
- Add:
  - `SECRET_KEY`: (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
  - `JWT_SECRET_KEY`: (generate same way)
  - `FLASK_ENV`: `production`

6. **Get Your URL**

Railway provides a URL like: `https://your-app.railway.app`

7. **Update Frontend API URL**

Edit `auth.js` line 5:

```javascript
const API_BASE_URL = 'https://your-app.railway.app/api';
```

Commit and push changes.

---

## Heroku Deployment

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps

1. **Install Heroku CLI**

```bash
# Mac
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# Download from heroku.com/downloads
```

2. **Login to Heroku**

```bash
heroku login
```

3. **Create `Procfile` in project root:**

```
web: cd backend && gunicorn app:app
```

4. **Update `backend/requirements.txt`:**

Add:
```
gunicorn==21.2.0
```

5. **Create `runtime.txt` in project root:**

```
python-3.11.7
```

6. **Create Heroku App**

```bash
heroku create countdown-timer-app
# Note: Use your own unique name
```

7. **Set Environment Variables**

```bash
heroku config:set SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
heroku config:set JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
heroku config:set FLASK_ENV=production
```

8. **Deploy**

```bash
git push heroku main
# Or if on different branch:
git push heroku claude/countdown-timer-design-011CV2QoZSmwcQbxjH9WKti5:main
```

9. **Open App**

```bash
heroku open
```

10. **Update Frontend API URL**

Edit `auth.js`:

```javascript
const API_BASE_URL = 'https://countdown-timer-app.herokuapp.com/api';
```

11. **View Logs**

```bash
heroku logs --tail
```

---

## DigitalOcean Deployment

Deploy on a $5/month droplet with full control.

### Prerequisites
- DigitalOcean account
- SSH access

### Steps

1. **Create Droplet**

- Go to DigitalOcean
- Create Droplet
- Choose Ubuntu 22.04 LTS
- Select $6/month plan
- Add SSH key

2. **SSH into Server**

```bash
ssh root@your-droplet-ip
```

3. **Install Dependencies**

```bash
# Update system
apt update && apt upgrade -y

# Install Python and Nginx
apt install python3 python3-pip nginx git -y

# Install SQLite
apt install sqlite3 -y
```

4. **Clone Repository**

```bash
cd /var/www
git clone <your-repo-url> countdown_timer
cd countdown_timer
```

5. **Set Up Backend**

```bash
cd backend
pip3 install -r requirements.txt

# Create environment file
cp .env.example .env
nano .env  # Edit and add secure keys
```

6. **Create Systemd Service**

```bash
nano /etc/systemd/system/countdown-timer.service
```

Add:

```ini
[Unit]
Description=Countdown Timer Flask App
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/countdown_timer/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 /var/www/countdown_timer/backend/app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

7. **Configure Nginx**

```bash
nano /etc/nginx/sites-available/countdown-timer
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or your IP

    root /var/www/countdown_timer;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/countdown-timer /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

8. **Start Services**

```bash
systemctl enable countdown-timer
systemctl start countdown-timer
systemctl status countdown-timer
```

9. **Set Up SSL (Optional but Recommended)**

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

10. **Configure Firewall**

```bash
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

**Access:** http://your-droplet-ip or http://your-domain.com

---

## Production Checklist

### Security

- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY` to strong random values
- [ ] Set `FLASK_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS to only allow your domain
- [ ] Use PostgreSQL instead of SQLite for production
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Enable CSRF protection
- [ ] Use secure session cookies

### Performance

- [ ] Use production WSGI server (Gunicorn/uWSGI)
- [ ] Enable gzip compression
- [ ] Set up caching (Redis)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Minify frontend assets
- [ ] Use CDN for static files
- [ ] Enable database connection pooling

### Monitoring

- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure health check endpoints
- [ ] Monitor server resources
- [ ] Set up uptime monitoring
- [ ] Configure automated backups
- [ ] Set up alerts for errors

### Updates Needed for Production

**backend/app.py:**

```python
# Update CORS configuration
CORS(app, origins=[
    "https://yourdomain.com",
    "https://www.yourdomain.com"
])

# Use PostgreSQL
import os
from urllib.parse import urlparse

if os.getenv('DATABASE_URL'):
    # Parse Heroku/Railway database URL
    url = urlparse(os.getenv('DATABASE_URL'))
    # Configure PostgreSQL connection
```

**auth.js:**

```javascript
// Use production API URL
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://api.yourdomain.com/api';
```

---

## Troubleshooting

### Backend Won't Start

**Issue:** Port 5000 already in use

```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Issue:** Module not found

```bash
pip3 install -r requirements.txt --force-reinstall
```

### Frontend Can't Connect to Backend

**Issue:** CORS errors

Check `backend/app.py`:
```python
from flask_cors import CORS
CORS(app, origins=['*'])  # For development
```

**Issue:** Wrong API URL

Update `auth.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url/api';
```

### Database Issues

**Issue:** Database locked

```bash
# Stop all processes
pkill -f "python3 app.py"
# Remove database
rm backend/timer_app.db
# Restart app (will recreate database)
```

### SSL/HTTPS Issues

**Issue:** Mixed content errors

Ensure all API calls use HTTPS:
```javascript
const API_BASE_URL = 'https://api.yourdomain.com/api';
```

---

## Quick Deployment Commands Cheat Sheet

### Docker
```bash
docker-compose up -d                    # Start
docker-compose logs -f                  # View logs
docker-compose down                     # Stop
docker-compose restart                  # Restart
```

### Railway
```bash
railway login                           # Login
railway init                            # Initialize
railway up                              # Deploy
railway logs                            # View logs
railway open                            # Open in browser
```

### Heroku
```bash
heroku login                            # Login
heroku create app-name                  # Create app
git push heroku main                    # Deploy
heroku logs --tail                      # View logs
heroku open                             # Open in browser
heroku ps:restart                       # Restart
```

### DigitalOcean
```bash
systemctl status countdown-timer        # Check status
systemctl restart countdown-timer       # Restart app
systemctl restart nginx                 # Restart nginx
journalctl -u countdown-timer -f        # View logs
```

---

## Recommended: Railway Deployment (Easiest)

For the quickest deployment with minimal setup:

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Add environment variables (SECRET_KEY, JWT_SECRET_KEY)
6. Deploy!

Railway provides:
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Zero configuration
- ✅ Auto-deploys on git push
- ✅ Built-in monitoring
- ✅ Easy scaling

---

## Need Help?

- Check logs for specific error messages
- Review ARCHITECTURE.md for system details
- Test backend separately: `curl http://localhost:5000/api/health`
- Verify environment variables are set
- Check firewall settings

**Success!** 🎉 Your countdown timer is now deployed and accessible to the world!

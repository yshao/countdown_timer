# Admin Panel Setup Guide

This guide will help you set up the admin panel with Supabase authentication and AI writing capabilities powered by Anthropic's Claude.

## 🔑 Admin Credentials

**Default Login:**
- **Email:** `admin@example.com`
- **Password:** `Admin123!`

⚠️ **Important:** Change these credentials in production by modifying the `.env` file.

## 📋 Prerequisites

1. **Supabase Account** - Get your credentials from [supabase.com](https://supabase.com)
2. **Google AI API Key** - Get your API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
3. **Python 3.8+** installed
4. **PostgreSQL** (via Supabase)

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit the `.env` file with your actual credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Google Gemini API for AI Writing
GOOGLE_API_KEY=your-google-api-key-here

# Flask Configuration (change in production!)
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
```

### Step 3: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase_schema.sql`
4. Paste and execute the SQL to create the necessary tables

Or use the command line:

```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase_schema.sql
```

The schema creates these tables:
- `admin_users` - Admin user accounts
- `admin_sessions` - Session tracking
- `ai_generated_content` - AI generation history
- `admin_activity_log` - Audit trail

### Step 4: Start the Backend Server

```bash
cd backend
python app.py
```

The server will start on `http://localhost:5000`

### Step 5: Access the Admin Panel

Open your browser and navigate to:

```
http://localhost:5000/admin.html
```

Or if running the frontend separately:

```
http://localhost:8000/admin.html
```

## 🎨 Features

### 1. **AI Content Generation**
- Generate high-quality content using Google Gemini 2.0 Flash
- Choose from different Gemini models (2.0 Flash, 1.5 Pro, 1.5 Flash)
- Adjust max tokens for content length (up to 8000 tokens)
- Copy or download generated content
- Full generation history

### 2. **Activity Logging**
- Track all admin actions
- View login/logout events
- Monitor AI generation usage
- IP address tracking

### 3. **Secure Authentication**
- JWT-based authentication
- Token expiration handling
- Automatic session verification
- Secure password hashing

### 4. **Admin Management**
- View admin account details
- Monitor API configuration status
- Access to system settings

## 🔐 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/verify` - Verify token
- `POST /api/admin/logout` - Admin logout

### AI Writing
- `POST /api/admin/ai/generate` - Generate content
- `GET /api/admin/ai/history` - Get generation history

### Activity
- `GET /api/admin/activity` - Get activity log

## 📊 Database Tables

### admin_users
Stores admin user accounts with hashed passwords.

### admin_sessions
Tracks active admin sessions for security monitoring.

### ai_generated_content
Stores all AI-generated content with metadata:
- Prompt used
- Generated content
- Model used
- Timestamp
- Admin who generated it

### admin_activity_log
Audit trail of all admin actions:
- Action type
- Details (JSON)
- IP address
- Timestamp

## 🛡️ Security Features

1. **Password Hashing** - SHA-256 (upgrade to bcrypt in production)
2. **JWT Tokens** - Secure authentication with expiration
3. **Row Level Security (RLS)** - Supabase policies restrict data access
4. **Session Monitoring** - Track and invalidate sessions
5. **Activity Logging** - Complete audit trail
6. **CORS Protection** - Configured for specific origins

## 🔧 Customization

### Adding More Admin Users

Run this SQL in Supabase:

```sql
-- First, hash your password using Python:
-- python -c "import hashlib; print(hashlib.sha256('YourPassword'.encode()).hexdigest())"

INSERT INTO admin_users (email, password_hash, full_name, is_active)
VALUES ('newadmin@example.com', 'YOUR_PASSWORD_HASH_HERE', 'New Admin Name', true);
```

### Changing AI Models

Edit `admin.html` to add more Gemini model options:

```html
<select id="ai-model">
    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Recommended)</option>
    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
    <!-- Add more Gemini models here -->
</select>
```

### Customizing the UI

Edit `admin-styles.css` to change colors, fonts, and layout:

```css
:root {
    --primary-color: #4f46e5; /* Change to your brand color */
    --secondary-color: #10b981;
    /* ... more variables */
}
```

## 🐛 Troubleshooting

### "Admin system not configured"
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in `.env`
- Verify Supabase credentials are correct

### "AI service not configured"
- Check that `GOOGLE_API_KEY` is set in `.env`
- Verify your Google API key is valid
- Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### "Invalid credentials"
- Verify the admin user exists in the `admin_users` table
- Check password is hashed correctly
- Try using default credentials first

### Database connection errors
- Ensure Supabase database is running
- Check network connectivity
- Verify database credentials

### Token expiration issues
- Tokens expire after 24 hours by default
- Adjust `JWT_ACCESS_TOKEN_EXPIRES` in `backend/app.py`
- Clear browser localStorage and login again

## 📝 Development Tips

### Enable Debug Mode

In `backend/app.py`:

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

### View API Logs

The backend prints useful logs to console:
- Admin user initialization
- Login attempts
- AI generation requests
- Errors and warnings

### Testing API Endpoints

Use curl or Postman:

```bash
# Login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Generate content (use token from login)
curl -X POST http://localhost:5000/api/admin/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"prompt":"Write a haiku about coding"}'
```

## 🚀 Production Deployment

### Environment Variables

Set these in your hosting platform:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_API_KEY`
- `SECRET_KEY` (generate a strong random key)
- `JWT_SECRET_KEY` (generate a strong random key)
- `FLASK_ENV=production`

### Security Checklist

- [ ] Change default admin credentials
- [ ] Use bcrypt for password hashing (replace SHA-256)
- [ ] Enable HTTPS
- [ ] Set strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Configure CORS for your domain only
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Recommended Hosting

- **Backend:** Railway, Heroku, or DigitalOcean
- **Database:** Supabase (managed PostgreSQL)
- **Frontend:** Vercel, Netlify, or Cloudflare Pages

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Flask Documentation](https://flask.palletsprojects.com)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review error logs in the console
3. Verify all environment variables are set correctly
4. Ensure database schema is properly set up
5. Test API endpoints directly with curl

## 📄 License

MIT License - Feel free to modify and use for your projects!

# Enhanced Security Implementation

This document explains the security measures implemented in the Countdown Timer application with Supabase authentication.

## Security Features

### 1. Server-Side Session Validation

Unlike basic Row-Level Security (RLS), this implementation uses **server-side session validation** for enhanced security:

**How it works:**
- Client authenticates with Supabase and receives a JWT token
- Every session is verified with the backend server (`/api/auth/verify-session`)
- Backend uses Supabase service role key to validate tokens server-side
- Invalid or expired tokens are rejected

**Benefits:**
- Additional layer beyond client-side validation
- Server can implement custom authorization logic
- Tokens are validated against the actual Supabase auth service
- Prevents token tampering and replay attacks

### 2. Automatic Session Monitoring

The frontend automatically monitors session validity:

- **Periodic Checks**: Every 5 minutes, the session is re-validated
- **Automatic Logout**: Expired sessions trigger automatic logout
- **Token Refresh**: Supabase automatically refreshes tokens before expiry
- **State Sync**: Auth state stays synchronized across browser tabs

### 3. Enhanced Input Validation

#### Client-Side Validation
- **Email**: RFC-compliant email format validation
- **Password**: Minimum 8 characters (enforced client-side)
- **Username**: 3-20 characters, alphanumeric + underscores only
- **Trim Inputs**: All inputs are trimmed to prevent whitespace issues

#### Server-Side Validation
- Backend validates all inputs before processing
- Protection against SQL injection (Supabase uses parameterized queries)
- XSS prevention through proper input sanitization
- CSRF protection via token-based auth

### 4. Security Best Practices

**Authentication:**
- Passwords are hashed by Supabase (bcrypt)
- JWT tokens are signed and encrypted
- Email verification available (configurable)
- Secure session storage in browser

**API Security:**
- CORS properly configured
- Authorization required for protected endpoints
- Rate limiting (can be added)
- HTTPS required in production

## Setup Instructions

### 1. Supabase Configuration

Create a Supabase project and configure:

```sql
-- Enable email authentication
-- No additional tables required for basic auth
-- Supabase handles user storage in auth.users table
```

### 2. Environment Variables

Create `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Flask Configuration
SECRET_KEY=your-secret-key-change-me
FLASK_ENV=development
PORT=5000
```

### 3. Frontend Configuration

Update `config.js` with your Supabase project details:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

**Or** create `env.js`:

```javascript
window.ENV = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here'
};
```

Include before other scripts:
```html
<script src="env.js"></script>
```

### 4. Run the Application

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start backend server
python app.py

# Open frontend
# Navigate to http://localhost:5000 in your browser
```

## Security Checklist

### Development
- [ ] Use test Supabase project
- [ ] Enable Supabase email confirmations (recommended)
- [ ] Set strong secret keys
- [ ] Never commit `.env` files
- [ ] Use HTTPS for production testing

### Production
- [ ] Use production Supabase project
- [ ] Enable email confirmations
- [ ] Set secure, random secret keys (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for specific domains only
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Register/Login
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  (User Management)  │
└──────┬──────────────┘
       │
       │ 2. JWT Token
       ▼
┌─────────────────────┐
│   Frontend          │
│   (supabase-auth.js)│
└──────┬──────────────┘
       │
       │ 3. Verify Session
       ▼
┌─────────────────────┐
│   Backend API       │
│   (/api/auth/...)   │
└──────┬──────────────┘
       │
       │ 4. Validate with Supabase
       ▼
┌─────────────────────┐
│  Supabase API       │
│  (Token Validation) │
└─────────────────────┘
```

## API Endpoints

### POST /api/auth/verify-session
Verify a Supabase session token

**Headers:**
```
Authorization: Bearer <supabase-jwt-token>
```

**Response:**
```json
{
  "valid": true,
  "user_id": "uuid",
  "email": "user@example.com"
}
```

### GET /api/auth/user-profile
Get current user profile

**Headers:**
```
Authorization: Bearer <supabase-jwt-token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "display_name": "Display Name",
  "created_at": "2024-01-01T00:00:00Z",
  "email_confirmed": true
}
```

### GET /api/auth/health
Health check for authentication service

**Response:**
```json
{
  "status": "healthy",
  "supabase_configured": true
}
```

## Common Issues and Solutions

### Session not persisting
- Clear browser cookies and local storage
- Check if Supabase URL and anon key are correct
- Verify CORS is properly configured

### Registration not working
- Check Supabase email auth is enabled
- Verify email confirmation settings
- Check browser console for errors

### Backend validation failing
- Ensure SUPABASE_SERVICE_KEY is set
- Check service key has correct permissions
- Verify network connectivity to Supabase

### 401 Unauthorized errors
- Session may have expired, try logging in again
- Check if JWT token is being sent correctly
- Verify backend can reach Supabase API

## Advanced Security (Optional)

### Rate Limiting
Add Flask-Limiter to prevent brute force attacks:

```bash
pip install Flask-Limiter
```

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@limiter.limit("5 per minute")
@app.route('/api/auth/verify-session', methods=['POST'])
def verify_session():
    # ...
```

### IP Whitelisting
Restrict API access to known IP addresses in production.

### Audit Logging
Log all authentication events for security monitoring:

```python
import logging

logging.basicConfig(filename='auth.log', level=logging.INFO)

def log_auth_event(event_type, user_id, ip_address):
    logging.info(f'{event_type}: user={user_id}, ip={ip_address}')
```

### Two-Factor Authentication
Supabase supports 2FA - enable in project settings.

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Flask Security](https://flask.palletsprojects.com/en/2.3.x/security/)

## Support

For security issues, please report privately to the maintainers rather than creating public issues.

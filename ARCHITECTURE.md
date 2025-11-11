# 🏗️ Countdown Timer - Architecture Documentation

## Overview

The Countdown Timer application has been upgraded from a pure frontend application to a **full-stack application** with:
- **Python Flask Backend API** for user authentication and data management
- **SQLite Database** for persistent storage
- **JWT-based Authentication** for secure user sessions
- **RESTful API** architecture
- **Frontend Integration** with backend services

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  index.html - Main UI with Auth Header               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  timer.js - Core countdown logic (unchanged)         │  │
│  │  auth.js - Authentication management                 │  │
│  │  app.js - UI integration + API calls                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │  HTTP/JSON                       │
│                          ▼                                   │
├─────────────────────────────────────────────────────────────┤
│                     FLASK API SERVER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app.py - Flask application + JWT middleware         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  API Endpoints:                                       │  │
│  │  • POST /api/auth/register                            │  │
│  │  • POST /api/auth/login                               │  │
│  │  • POST /api/auth/logout                              │  │
│  │  • GET  /api/auth/me                                  │  │
│  │  • GET  /api/preferences                              │  │
│  │  • POST /api/preferences                              │  │
│  │  • GET  /api/presets                                  │  │
│  │  • POST /api/presets                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │  SQLite                          │
│                          ▼                                   │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  models.py - Database models & operations            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Tables:                                              │  │
│  │  • users - User accounts                              │  │
│  │  • user_preferences - Settings storage               │  │
│  │  • user_presets - Custom timer presets               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│                  timer_app.db (SQLite)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
countdown_timer/
├── frontend/
│   ├── index.html          # Main UI with auth header
│   ├── styles.css          # Complete styling (header + modals)
│   ├── timer.js            # Core countdown logic
│   ├── auth.js             # Authentication management
│   └── app.js              # UI integration
│
├── backend/
│   ├── app.py              # Flask API server
│   ├── models.py           # Database models
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment template
│   ├── start_server.sh     # Server startup script
│   ├── verify_backend.py   # Database verification tests
│   └── test_api.py         # API endpoint tests
│
├── timer_app.db           # SQLite database (created on first run)
├── README.md              # User documentation
├── ARCHITECTURE.md        # This file
└── TESTING.md             # Testing guide
```

---

## Backend API

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "username": "string (min 3 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user_id": 1
}
```

#### POST /api/auth/login
Login and receive JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAi...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/logout
Logout (blacklist token).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### GET /api/auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com",
  "created_at": "2025-01-01 12:00:00",
  "last_login": "2025-01-02 10:30:00"
}
```

### Preferences Endpoints

#### GET /api/preferences
Get all preferences for current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "preferences": {
    "voice_enabled": "true",
    "default_hours": "0",
    "default_minutes": "5",
    "default_seconds": "0"
  }
}
```

#### POST /api/preferences
Set multiple preferences.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "preferences": {
    "voice_enabled": "false",
    "default_minutes": "10"
  }
}
```

**Response (200):**
```json
{
  "message": "Preferences updated successfully"
}
```

### Presets Endpoints

#### GET /api/presets
Get all custom timer presets.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "presets": [
    {
      "id": 1,
      "name": "Quick Break",
      "hours": 0,
      "minutes": 5,
      "seconds": 0,
      "created_at": "2025-01-01 12:00:00"
    }
  ]
}
```

#### POST /api/presets
Create a new timer preset.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Pomodoro",
  "hours": 0,
  "minutes": 25,
  "seconds": 0
}
```

**Response (201):**
```json
{
  "message": "Preset created successfully",
  "preset_id": 2
}
```

---

## Database Schema

### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(user_id, preference_key)
);
```

### user_presets
```sql
CREATE TABLE user_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    hours INTEGER NOT NULL,
    minutes INTEGER NOT NULL,
    seconds INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

---

## Frontend Authentication Flow

1. **Page Load**
   - `auth.js` initializes
   - Checks `localStorage` for saved token
   - If token exists, verifies with backend `/api/auth/me`
   - Updates UI based on auth state

2. **User Registration**
   - User clicks "Register" in header
   - Modal appears with registration form
   - On submit, POST to `/api/auth/register`
   - Auto-login after successful registration
   - Save token to `localStorage`
   - Load user preferences

3. **User Login**
   - User clicks "Login" in header
   - Modal appears with login form
   - On submit, POST to `/api/auth/login`
   - Save token to `localStorage`
   - Load user preferences
   - Update UI to show username

4. **Authenticated Requests**
   - All API calls include JWT token in header:
     `Authorization: Bearer <token>`
   - If 401 response, clear auth and show login

5. **User Logout**
   - User clicks "Logout" in header
   - POST to `/api/auth/logout` to blacklist token
   - Clear token from `localStorage`
   - Reset UI to logged-out state

---

## Security Features

### Password Security
- Passwords hashed using SHA-256
- Never stored in plain text
- Minimum 6 characters required

### JWT Authentication
- 24-hour token expiration
- Tokens signed with secret key
- Blacklist mechanism for logout
- Token verification on protected endpoints

### CORS Configuration
- Flask-CORS enabled for cross-origin requests
- Configured for development (allow all origins)
- Should be restricted in production

### Input Validation
- Backend validates all inputs
- Frontend validates before submission
- SQL injection prevented by parameterized queries
- XSS prevented by proper escaping

---

## User Preferences System

### Default Preferences
When a user registers, these defaults are set:
- `voice_enabled`: `"true"`
- `default_hours`: `"0"`
- `default_minutes`: `"1"`
- `default_seconds`: `"0"`

### Custom Preferences
Users can store any key-value preferences:
- Timer defaults
- UI preferences
- Custom settings
- All stored as strings in database

### Preference Loading
1. User logs in
2. Frontend calls GET `/api/preferences`
3. Apply preferences to timer UI
4. Voice toggle state restored
5. Default time values restored

### Preference Saving
1. User changes settings
2. Frontend calls POST `/api/preferences`
3. Updated in database
4. Applied immediately to UI

---

## Development Setup

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip3 install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set SECRET_KEY and JWT_SECRET_KEY
   ```

3. **Start Server**
   ```bash
   ./start_server.sh
   # Or manually:
   python3 app.py
   ```

4. **Verify Backend**
   ```bash
   python3 verify_backend.py
   # Should show 15/15 tests passing
   ```

### Frontend Setup

1. **Start Web Server**
   ```bash
   # In project root
   python3 -m http.server 8000
   ```

2. **Open Browser**
   ```
   http://localhost:8000
   ```

3. **Backend must be running on port 5000**

---

## Testing

### Backend Tests
```bash
cd backend

# Verify database models (15 tests)
python3 verify_backend.py

# Run API endpoint tests (22 tests)
python3 test_api.py
```

### Frontend Timer Tests
```bash
# In project root
node run-tests.js
# Tests core timer logic (40 tests)
```

### Manual Testing
See `TESTING.md` for comprehensive manual test scenarios.

---

## Deployment Considerations

### Production Checklist

- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY` to strong random values
- [ ] Set `FLASK_ENV=production`
- [ ] Use PostgreSQL or MySQL instead of SQLite
- [ ] Configure proper CORS origins (restrict to your domain)
- [ ] Use HTTPS for all API calls
- [ ] Implement rate limiting
- [ ] Add input sanitization layer
- [ ] Set up proper logging
- [ ] Configure backup strategy for database
- [ ] Use environment variables for all secrets
- [ ] Deploy behind reverse proxy (nginx)
- [ ] Enable database connection pooling

### Recommended Stack

**Backend:**
- Gunicorn WSGI server
- Nginx reverse proxy
- PostgreSQL database
- Redis for session/cache

**Frontend:**
- CDN for static files
- Minified JS/CSS
- Service worker for offline support

---

## Future Enhancements

### Planned Features
- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Social login (Google, GitHub)
- [ ] Timer history/statistics
- [ ] Shared timers between users
- [ ] Mobile app (React Native)
- [ ] WebSocket for real-time updates
- [ ] Export timer data (CSV, JSON)
- [ ] Dark mode preference
- [ ] Multiple timer instances
- [ ] Timer templates/categories

### API Versioning
Consider adding `/api/v1/` prefix for future API versions.

---

## Troubleshooting

### Backend Won't Start
- Check if port 5000 is available
- Verify Python dependencies installed
- Check .env file exists
- Review error logs

### Frontend Can't Connect
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Ensure API_BASE_URL in auth.js is correct
- Try clearing browser cache/localStorage

### Authentication Issues
- Check JWT_SECRET_KEY matches between sessions
- Verify token hasn't expired (24h lifetime)
- Clear localStorage and re-login
- Check token format in network tab

### Database Issues
- Delete `timer_app.db` and restart (dev only)
- Check file permissions
- Verify SQLite3 is installed
- Run `verify_backend.py` to diagnose

---

## Support

For issues, questions, or contributions:
- Check `TESTING.md` for test procedures
- Review `README.md` for usage instructions
- Run verification scripts for diagnostics

---

**Built with Test-Driven Development**
Last Updated: November 11, 2025

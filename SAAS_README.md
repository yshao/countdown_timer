# Countdown Timer SaaS Template

A complete SaaS application template featuring a countdown timer with voice announcements, built with **Supabase** authentication and **Stripe** payment integration.

## Features

### ✨ Core Functionality
- **Countdown Timer** with voice announcements
- **Preset Times** for quick setup (1min, 5min, 10min, 30min)
- **Custom Time Entry** (hours, minutes, seconds)
- **Voice Announcements** at key intervals
- **Visual Progress Bar** with color-coded warnings
- **Start, Pause, Resume, Reset** controls

### 🔐 Authentication (Supabase)
- **User Registration** with email verification
- **Secure Login** with JWT tokens
- **Session Management** with automatic refresh
- **Password Reset** capabilities
- **Row-Level Security** for data protection

### 💳 Subscription Management (Stripe)
- **Three Subscription Tiers:**
  - **Free** - Basic features, 3 presets, 1-hour limit
  - **Pro** ($9.99/mo) - Unlimited presets, no limits, custom themes
  - **Premium** ($19.99/mo) - Team features, API access, analytics
- **Stripe Checkout** for seamless payments
- **Customer Portal** for subscription management
- **Webhook Integration** for real-time subscription updates
- **14-Day Free Trial** on paid plans

### 🎨 User Experience
- **Modern Gradient UI** with smooth animations
- **Responsive Design** for mobile and desktop
- **Modal-Based Workflows** for clean interactions
- **Real-Time Updates** for subscription status
- **Visual Subscription Badges** showing current plan

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No framework dependencies
- **Supabase JS** - Authentication and database
- **Stripe JS** - Payment processing

### Backend
- **Python/Flask** - RESTful API server
- **Supabase** - Database and authentication
- **Stripe** - Payment processing and webhooks
- **PostgreSQL** - Database (via Supabase)

## Project Structure

```
countdown_timer/
├── index.html              # Main application page
├── styles.css              # All styles including pricing UI
├── config.js               # Configuration for Supabase and Stripe
├── timer.js                # Core timer logic
├── supabase-auth.js        # Supabase authentication
├── stripe-integration.js   # Stripe payment integration
├── app.js                  # Main application controller
├── package.json            # Frontend dependencies
├── .env.example            # Environment variables template
│
├── backend/
│   ├── app.py              # Flask application
│   ├── stripe_routes.py    # Stripe webhook handlers
│   ├── models.py           # Database models (legacy)
│   └── requirements.txt    # Python dependencies
│
└── docs/
    ├── SUPABASE_SETUP.md   # Supabase configuration guide
    ├── STRIPE_SETUP.md     # Stripe configuration guide
    └── SAAS_README.md      # This file
```

## Quick Start

### Prerequisites

- Node.js and npm (for installing frontend dependencies)
- Python 3.8+ (for backend)
- Supabase account
- Stripe account

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd countdown_timer

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Set Up Supabase

Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Create a Supabase project
2. Run the SQL schema to create tables
3. Configure authentication
4. Get your API keys

### 3. Set Up Stripe

Follow the detailed guide in [STRIPE_SETUP.md](./STRIPE_SETUP.md):

1. Create products and prices
2. Set up webhooks
3. Get your API keys

### 4. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual keys
nano .env
```

Update these values:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PREMIUM=price_...

# App
FRONTEND_URL=http://localhost:5000
```

### 5. Update Frontend Config

Edit `config.js` and update with your keys:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
};

const STRIPE_CONFIG = {
    publishableKey: 'pk_test_...'
};
```

Or create a `public/env.js` file (better for production):

```javascript
window.ENV = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
    STRIPE_PRICE_PRO: 'price_...',
    STRIPE_PRICE_PREMIUM: 'price_...'
};
```

### 6. Run the Application

```bash
# Terminal 1: Start the Flask backend
cd backend
python app.py

# Terminal 2: Forward Stripe webhooks (development only)
stripe listen --forward-to http://localhost:5000/api/stripe/webhook

# Open your browser
# Navigate to http://localhost:5000
```

## Usage Guide

### For Users

1. **Register an Account**
   - Click "Register" in the header
   - Enter username, email, and password
   - Verify your email (if enabled)
   - Start with the free plan

2. **Use the Timer**
   - Set hours, minutes, and seconds
   - Or click a preset button (1min, 5min, etc.)
   - Click "Start" to begin countdown
   - Enable/disable voice announcements
   - Pause, resume, or reset as needed

3. **Upgrade Your Plan**
   - Click "Upgrade" in the header
   - Choose Pro or Premium plan
   - Complete payment via Stripe Checkout
   - Enjoy unlimited features

4. **Manage Subscription**
   - Click "Manage your subscription" in pricing modal
   - Opens Stripe Customer Portal
   - Update payment method, view invoices, or cancel

### For Developers

#### Adding New Features

**Add a New Subscription Plan:**

1. Create product in Stripe
2. Update `config.js` with new plan details
3. Add pricing card to `index.html`
4. Update subscription limits in code

**Add User Preferences:**

1. Add fields to Supabase `user_preferences` table
2. Create API endpoints in `backend/app.py`
3. Update frontend to save/load preferences

**Customize Styling:**

- Edit `styles.css` for colors, fonts, layouts
- Modify gradient in `body` background
- Update modal styles
- Customize pricing cards

## Deployment

### Deploy to Vercel (Frontend + Serverless Backend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Configure webhook endpoint in Stripe
```

### Deploy to Railway (Full Stack)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up

# Set environment variables
railway variables set SUPABASE_URL=...
railway variables set STRIPE_SECRET_KEY=...
# etc.
```

### Deploy Backend to Heroku

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set SUPABASE_URL=...
heroku config:set STRIPE_SECRET_KEY=...

# Deploy
git push heroku main
```

### Post-Deployment Checklist

- [ ] Update Supabase redirect URLs with production domain
- [ ] Update Stripe webhook endpoint with production URL
- [ ] Switch Stripe to live mode and update keys
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test subscription checkout
- [ ] Test webhook delivery
- [ ] Monitor error logs
- [ ] Set up SSL/HTTPS
- [ ] Configure domain name

## Customization Ideas

### Branding
- Update colors in `styles.css`
- Change app name in `index.html`
- Add your logo to header
- Customize email templates in Supabase

### Features
- Add timer history tracking
- Implement team collaboration
- Add timer sharing via URL
- Create timer templates
- Add recurring timers
- Integrate with calendar apps
- Add mobile app (React Native/Flutter)

### Monetization
- Add annual billing option
- Implement lifetime deals
- Create affiliate program
- Add usage-based pricing
- Offer add-ons

## Troubleshooting

### Registration Not Working

**Issue:** User can't register
- Check Supabase email auth is enabled
- Verify email confirmation settings
- Check browser console for errors
- Ensure RLS policies are correct

### Login Fails

**Issue:** Can't log in with valid credentials
- Verify Supabase URL and anon key
- Check user exists in Supabase dashboard
- Look for CORS errors in console
- Ensure email is verified (if required)

### Checkout Doesn't Work

**Issue:** Stripe checkout fails
- Verify Stripe publishable key is correct
- Check price IDs match Stripe dashboard
- Ensure backend `/api/stripe/create-checkout-session` works
- Look for CORS errors

### Subscription Not Updating

**Issue:** Payment succeeded but subscription not updated
- Check webhook is configured correctly
- Verify webhook signing secret
- Check backend logs for webhook errors
- Ensure Supabase service key has permissions

### Styling Issues

**Issue:** UI looks broken
- Clear browser cache
- Check CSS file loaded correctly
- Verify no JavaScript errors in console
- Test in different browser

## Testing

### Test User Flow

1. Register new user → ✓ User created in Supabase
2. Login → ✓ Session established
3. Use timer → ✓ Timer works correctly
4. Click upgrade → ✓ Pricing modal opens
5. Select plan → ✓ Checkout redirects
6. Complete payment → ✓ Subscription updated
7. Verify plan → ✓ Badge shows correct plan
8. Open portal → ✓ Can manage subscription

### Test Stripe Webhooks

```bash
# Use Stripe CLI to simulate events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all secrets
3. **Enable RLS** on all Supabase tables
4. **Validate webhooks** with signing secret
5. **Use HTTPS** in production
6. **Sanitize user inputs** server-side
7. **Implement rate limiting** on API endpoints
8. **Log security events** for auditing
9. **Regular dependency updates** for security patches
10. **Monitor for suspicious activity**

## Performance Optimization

1. **Lazy load** Stripe and Supabase libraries
2. **Minimize** and bundle JavaScript
3. **Optimize images** and assets
4. **Use CDN** for static files
5. **Enable caching** headers
6. **Compress responses** with gzip
7. **Database indexing** for fast queries
8. **Connection pooling** for Supabase

## Support and Resources

- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Flask Docs:** https://flask.palletsprojects.com/

## License

MIT License - feel free to use this template for your own SaaS projects!

## Credits

Built with ❤️ using:
- Supabase for authentication and database
- Stripe for payment processing
- Flask for the backend API
- Vanilla JavaScript for the frontend

---

**Need help?** Check the detailed setup guides:
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Stripe Setup Guide](./STRIPE_SETUP.md)

**Ready to launch your SaaS?** Follow the deployment section above!

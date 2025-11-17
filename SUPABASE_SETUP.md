# Supabase Database Setup

This document explains how to set up your Supabase database for the Countdown Timer SaaS application.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase
3. Note your project URL and anon key from the project settings

## Database Schema

### 1. Subscriptions Table

This table stores user subscription information.

```sql
-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own subscription
CREATE POLICY "Users can read their own subscription"
    ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow service role to manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage all subscriptions"
    ON subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');
```

### 2. User Preferences Table (Optional)

Store user-specific timer preferences.

```sql
-- Create user_preferences table
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Create index
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own preferences"
    ON user_preferences
    FOR ALL
    USING (auth.uid() = user_id);
```

### 3. Timer Presets Table (Optional)

Store user-created timer presets.

```sql
-- Create timer_presets table
CREATE TABLE timer_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    hours INTEGER NOT NULL DEFAULT 0,
    minutes INTEGER NOT NULL DEFAULT 0,
    seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_timer_presets_user_id ON timer_presets(user_id);

-- Enable RLS
ALTER TABLE timer_presets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own presets"
    ON timer_presets
    FOR ALL
    USING (auth.uid() = user_id);
```

## Setting Up Authentication

1. **Enable Email Authentication**
   - Go to Authentication > Settings in your Supabase dashboard
   - Enable "Email" as an authentication provider
   - Configure email templates (optional)

2. **Configure Email Confirmation (Recommended)**
   - Enable "Email Confirmations" for better security
   - Users will need to verify their email before logging in

3. **Set Up Redirect URLs**
   - Add your application URLs to the list of allowed redirect URLs
   - For development: `http://localhost:5000`, `http://127.0.0.1:5000`
   - For production: Your deployed domain

## Environment Variables

After setting up your Supabase project, update your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**Important:**
- The `SUPABASE_ANON_KEY` is safe to use in frontend code
- The `SUPABASE_SERVICE_KEY` should ONLY be used in backend code and kept secret
- Never commit your `.env` file to version control

## Testing the Setup

After running the SQL commands above, you can test your setup:

1. Try registering a new user through the app
2. Check the Supabase dashboard > Authentication > Users to see the new user
3. Check the subscriptions table to ensure a free plan record was created
4. Try logging in with the new user

## Subscription Plan Values

The `plan` column in the subscriptions table should contain one of:
- `free` - Free plan (default)
- `pro` - Pro plan ($9.99/month)
- `premium` - Premium plan ($19.99/month)

## Status Values

The `status` column can contain:
- `active` - Subscription is active
- `inactive` - Subscription is not active
- `past_due` - Payment failed, subscription is past due
- `canceled` - Subscription was canceled
- `trialing` - User is in trial period

## Troubleshooting

### Users can't register
- Check that email authentication is enabled
- Verify Row Level Security policies are set up correctly
- Check browser console for error messages

### Subscription not created on signup
- Verify the subscriptions table exists
- Check RLS policies allow service role to insert
- Look for errors in the browser console

### Can't read subscription data
- Verify RLS policies are set up correctly
- Make sure the user is authenticated
- Check that the user_id matches auth.uid()

## Next Steps

After setting up the database:
1. Configure Stripe (see STRIPE_SETUP.md)
2. Update environment variables in your frontend
3. Deploy your application
4. Test the complete flow: register → login → upgrade → checkout

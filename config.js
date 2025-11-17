/**
 * Configuration for Supabase and Stripe
 * In production, these should be set via environment variables
 */

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    anonKey: window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
};

// Stripe Configuration
const STRIPE_CONFIG = {
    publishableKey: window.ENV?.STRIPE_PUBLISHABLE_KEY || 'YOUR_STRIPE_PUBLISHABLE_KEY'
};

// Subscription Plans
const SUBSCRIPTION_PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        priceId: null,
        features: [
            'Basic countdown timer',
            'Voice announcements',
            '3 saved presets',
            'Standard support'
        ],
        limits: {
            maxPresets: 3,
            maxTimerDuration: 3600 // 1 hour in seconds
        }
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 9.99,
        priceId: window.ENV?.STRIPE_PRICE_PRO || 'price_pro',
        interval: 'month',
        features: [
            'Everything in Free',
            'Unlimited saved presets',
            'Advanced timer controls',
            'No time limits',
            'Priority support',
            'Custom themes'
        ],
        limits: {
            maxPresets: -1, // unlimited
            maxTimerDuration: -1 // unlimited
        }
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 19.99,
        priceId: window.ENV?.STRIPE_PRICE_PREMIUM || 'price_premium',
        interval: 'month',
        features: [
            'Everything in Pro',
            'Team collaboration',
            'API access',
            'Advanced analytics',
            'White-label option',
            'Dedicated support'
        ],
        limits: {
            maxPresets: -1, // unlimited
            maxTimerDuration: -1, // unlimited
            teamMembers: 10
        }
    }
};

// Export configuration
window.CONFIG = {
    supabase: SUPABASE_CONFIG,
    stripe: STRIPE_CONFIG,
    plans: SUBSCRIPTION_PLANS
};

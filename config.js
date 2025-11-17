/**
 * Configuration for Supabase
 * In production, these should be set via environment variables
 */

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    anonKey: window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
};

// Export configuration
window.CONFIG = {
    supabase: SUPABASE_CONFIG
};

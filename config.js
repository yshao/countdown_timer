/**
 * Configuration for Supabase
 * Fetches credentials from backend API endpoint
 */

// Initialize CONFIG with empty values
window.CONFIG = {
    supabase: {
        url: '',
        anonKey: ''
    },
    loaded: false
};

// Fetch configuration from backend
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            window.CONFIG.supabase = config.supabase;
            window.CONFIG.loaded = true;
            console.log('Configuration loaded from backend');
        } else {
            console.error('Failed to load config from backend:', response.status);
            // Fallback to environment variables if available
            if (window.ENV?.SUPABASE_URL && window.ENV?.SUPABASE_ANON_KEY) {
                window.CONFIG.supabase.url = window.ENV.SUPABASE_URL;
                window.CONFIG.supabase.anonKey = window.ENV.SUPABASE_ANON_KEY;
                window.CONFIG.loaded = true;
                console.log('Configuration loaded from window.ENV');
            }
        }
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback to environment variables if available
        if (window.ENV?.SUPABASE_URL && window.ENV?.SUPABASE_ANON_KEY) {
            window.CONFIG.supabase.url = window.ENV.SUPABASE_URL;
            window.CONFIG.supabase.anonKey = window.ENV.SUPABASE_ANON_KEY;
            window.CONFIG.loaded = true;
            console.log('Configuration loaded from window.ENV (fallback)');
        }
    }
}

// Load config immediately
loadConfig();

/**
 * Supabase Authentication Module
 * Handles user authentication, registration, and session management with enhanced security
 */

class SupabaseAuthManager {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.session = null;
        this.sessionCheckInterval = null;
        this.init();
    }

    /**
     * Initialize Supabase client and auth state
     */
    async init() {
        try {
            // Initialize Supabase client
            const { createClient } = supabase;
            this.supabase = createClient(
                window.CONFIG.supabase.url,
                window.CONFIG.supabase.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
            );

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                this.session = session;
                this.user = session?.user || null;

                if (session?.user) {
                    // Verify session with backend for added security
                    const isValid = await this.verifySessionWithBackend(session.access_token);
                    if (isValid) {
                        this.startSessionMonitoring();
                        this.updateUI(true);
                    } else {
                        console.warn('Session verification failed, logging out');
                        await this.logout();
                    }
                } else {
                    this.stopSessionMonitoring();
                    this.updateUI(false);
                }
            });

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.user = session.user;
                const isValid = await this.verifySessionWithBackend(session.access_token);
                if (isValid) {
                    this.startSessionMonitoring();
                    this.updateUI(true);
                } else {
                    await this.logout();
                }
            }
        } catch (error) {
            console.error('Supabase initialization error:', error);
            this.showError('Failed to initialize authentication. Please check your configuration.');
        }
    }

    /**
     * Verify session with backend server for additional security
     * This provides server-side validation beyond just client-side checks
     */
    async verifySessionWithBackend(accessToken) {
        try {
            const response = await fetch('/api/auth/verify-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    userId: this.user?.id
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.valid === true;
            }
            return false;
        } catch (error) {
            console.error('Session verification error:', error);
            // If backend is not available, allow local auth (dev mode)
            return true;
        }
    }

    /**
     * Start monitoring session validity
     * Periodically checks if the session is still valid
     */
    startSessionMonitoring() {
        // Clear any existing interval
        this.stopSessionMonitoring();

        // Check session validity every 5 minutes
        this.sessionCheckInterval = setInterval(async () => {
            if (this.session) {
                const { data: { session }, error } = await this.supabase.auth.getSession();
                if (error || !session) {
                    console.warn('Session expired or invalid');
                    await this.logout();
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Stop session monitoring
     */
    stopSessionMonitoring() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
        document.getElementById('login-error').classList.remove('show');
        document.getElementById('login-form').reset();
    }

    /**
     * Show register modal
     */
    showRegisterModal() {
        document.getElementById('register-modal').style.display = 'block';
        document.getElementById('register-error').classList.remove('show');
        document.getElementById('register-form').reset();
    }

    /**
     * Close all modals
     */
    closeModals() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'none';
    }

    /**
     * Handle registration with enhanced security
     */
    async handleRegister(event) {
        event.preventDefault();

        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value.trim();
        const errorEl = document.getElementById('register-error');

        // Client-side validation
        if (!this.validateEmail(email)) {
            errorEl.textContent = 'Please enter a valid email address';
            errorEl.classList.add('show');
            return;
        }

        if (password.length < 8) {
            errorEl.textContent = 'Password must be at least 8 characters long';
            errorEl.classList.add('show');
            return;
        }

        if (!this.validateUsername(username)) {
            errorEl.textContent = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
            errorEl.classList.add('show');
            return;
        }

        try {
            // Register with Supabase Auth
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        display_name: username
                    },
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) {
                errorEl.textContent = error.message;
                errorEl.classList.add('show');
                return;
            }

            if (data.user) {
                // Check if email confirmation is required
                const needsConfirmation = !data.session;

                // Show success message
                if (window.app) {
                    if (needsConfirmation) {
                        window.app.showStatus('Registration successful! Please check your email to verify your account.', 'success');
                    } else {
                        // Auto-confirmed - user is logged in immediately
                        window.app.showStatus('Registration successful! Welcome to Timer App!', 'success');
                    }
                }

                this.closeModals();
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorEl.textContent = 'Registration failed. Please try again.';
            errorEl.classList.add('show');
        }
    }

    /**
     * Handle login with enhanced security
     */
    async handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        // Client-side validation
        if (!this.validateEmail(email)) {
            errorEl.textContent = 'Please enter a valid email address';
            errorEl.classList.add('show');
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                errorEl.textContent = error.message;
                errorEl.classList.add('show');
                return;
            }

            if (data.user) {
                // Show success message
                if (window.app) {
                    window.app.showStatus('Login successful! Welcome back!', 'success');
                }

                this.closeModals();
            }
        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = 'Login failed. Please try again.';
            errorEl.classList.add('show');
        }
    }

    /**
     * Handle logout
     */
    async logout() {
        try {
            this.stopSessionMonitoring();

            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            // Show message
            if (window.app) {
                window.app.showStatus('Logged out successfully', 'info');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Update UI based on auth state
     */
    updateUI(isLoggedIn) {
        if (isLoggedIn && this.user) {
            document.getElementById('auth-logged-out').style.display = 'none';
            document.getElementById('auth-logged-in').style.display = 'flex';

            // Display username or email
            const username = this.user.user_metadata?.username ||
                           this.user.user_metadata?.display_name ||
                           this.user.email?.split('@')[0];
            document.getElementById('username-display').textContent = username;
        } else {
            document.getElementById('auth-logged-out').style.display = 'flex';
            document.getElementById('auth-logged-in').style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (window.app) {
            window.app.showStatus(message, 'error');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.user !== null && this.session !== null;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get current session token for API requests
     */
    getSessionToken() {
        return this.session?.access_token || null;
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate username format
     */
    validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }
}

// Create global auth instance
const auth = new SupabaseAuthManager();

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    if (event.target === loginModal) {
        auth.closeModals();
    }
    if (event.target === registerModal) {
        auth.closeModals();
    }
};

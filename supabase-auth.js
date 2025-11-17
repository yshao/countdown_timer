/**
 * Supabase Authentication Module
 * Handles user authentication, registration, and session management
 */

class SupabaseAuthManager {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.session = null;
        this.subscription = null;
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
                window.CONFIG.supabase.anonKey
            );

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                this.session = session;
                this.user = session?.user || null;

                if (session?.user) {
                    // Load user subscription data
                    await this.loadSubscription();
                    this.updateUI(true);
                } else {
                    this.subscription = null;
                    this.updateUI(false);
                }
            });

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.user = session.user;
                await this.loadSubscription();
                this.updateUI(true);
            }
        } catch (error) {
            console.error('Supabase initialization error:', error);
            this.showError('Failed to initialize authentication. Please check your configuration.');
        }
    }

    /**
     * Load user subscription data from database
     */
    async loadSubscription() {
        if (!this.user) return;

        try {
            const { data, error } = await this.supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', this.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error loading subscription:', error);
                return;
            }

            this.subscription = data || {
                user_id: this.user.id,
                plan: 'free',
                status: 'active'
            };

            // Update UI with subscription info
            if (window.subscriptionManager) {
                window.subscriptionManager.updateSubscriptionUI(this.subscription);
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
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
        const pricingModal = document.getElementById('pricing-modal');
        if (pricingModal) {
            pricingModal.style.display = 'none';
        }
    }

    /**
     * Handle registration
     */
    async handleRegister(event) {
        event.preventDefault();

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value;
        const errorEl = document.getElementById('register-error');

        try {
            // Register with Supabase Auth
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) {
                errorEl.textContent = error.message;
                errorEl.classList.add('show');
                return;
            }

            if (data.user) {
                // Create subscription record with free plan
                await this.createSubscriptionRecord(data.user.id);

                // Show success message
                if (window.app) {
                    window.app.showStatus('Registration successful! Please check your email to verify your account.', 'success');
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
     * Handle login
     */
    async handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

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
     * Create initial subscription record for new user
     */
    async createSubscriptionRecord(userId) {
        try {
            const { error } = await this.supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan: 'free',
                    status: 'active',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error creating subscription record:', error);
            }
        } catch (error) {
            console.error('Error creating subscription record:', error);
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
            const username = this.user.user_metadata?.username || this.user.email;
            document.getElementById('username-display').textContent = username;

            // Show subscription info
            const subscriptionEl = document.getElementById('subscription-info');
            if (subscriptionEl && this.subscription) {
                const plan = window.CONFIG.plans[this.subscription.plan];
                subscriptionEl.textContent = `${plan.name} Plan`;
                subscriptionEl.style.display = 'inline';
            }
        } else {
            document.getElementById('auth-logged-out').style.display = 'flex';
            document.getElementById('auth-logged-in').style.display = 'none';

            const subscriptionEl = document.getElementById('subscription-info');
            if (subscriptionEl) {
                subscriptionEl.style.display = 'none';
            }
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
     * Get current subscription
     */
    getSubscription() {
        return this.subscription;
    }

    /**
     * Check if user has access to a feature
     */
    hasFeatureAccess(feature) {
        if (!this.subscription) return false;

        const plan = window.CONFIG.plans[this.subscription.plan];
        if (!plan) return false;

        // Check specific limits
        if (feature.maxPresets !== undefined) {
            return plan.limits.maxPresets === -1 || feature.maxPresets <= plan.limits.maxPresets;
        }

        return true;
    }
}

// Create global auth instance
const auth = new SupabaseAuthManager();

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const pricingModal = document.getElementById('pricing-modal');

    if (event.target === loginModal) {
        auth.closeModals();
    }
    if (event.target === registerModal) {
        auth.closeModals();
    }
    if (event.target === pricingModal) {
        auth.closeModals();
    }
};

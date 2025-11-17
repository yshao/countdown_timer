/**
 * Authentication Module for Countdown Timer
 * Handles user login, registration, logout, and token management
 */

// Use relative URL for production (Vercel) and localhost for development
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.init();
    }

    /**
     * Initialize authentication state
     */
    async init() {
        // Load token from localStorage
        this.token = localStorage.getItem('auth_token');

        if (this.token) {
            // Verify token is still valid
            const valid = await this.verifyToken();
            if (valid) {
                this.updateUI(true);
            } else {
                this.clearAuth();
            }
        }
    }

    /**
     * Verify authentication token
     */
    async verifyToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.user = await response.json();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
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
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful
                this.token = data.access_token;
                this.user = data.user;

                // Save token
                localStorage.setItem('auth_token', this.token);

                // Update UI
                this.closeModals();
                this.updateUI(true);

                // Load user preferences
                if (window.app) {
                    await window.app.loadUserPreferences();
                }

                // Show success message
                if (window.app) {
                    window.app.showStatus('Login successful! Welcome back!', 'success');
                }
            } else {
                // Login failed
                errorEl.textContent = data.error || 'Login failed';
                errorEl.classList.add('show');
            }
        } catch (error) {
            errorEl.textContent = 'Network error. Please check if the backend server is running.';
            errorEl.classList.add('show');
            console.error('Login error:', error);
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegister(event) {
        event.preventDefault();

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful, now login
                errorEl.classList.remove('show');

                // Auto-login after successful registration
                const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok) {
                    this.token = loginData.access_token;
                    this.user = loginData.user;

                    // Save token
                    localStorage.setItem('auth_token', this.token);

                    // Update UI
                    this.closeModals();
                    this.updateUI(true);

                    // Load user preferences
                    if (window.app) {
                        await window.app.loadUserPreferences();
                    }

                    // Show success message
                    if (window.app) {
                        window.app.showStatus('Registration successful! Welcome!', 'success');
                    }
                }
            } else {
                // Registration failed
                errorEl.textContent = data.error || 'Registration failed';
                errorEl.classList.add('show');
            }
        } catch (error) {
            errorEl.textContent = 'Network error. Please check if the backend server is running.';
            errorEl.classList.add('show');
            console.error('Registration error:', error);
        }
    }

    /**
     * Handle logout
     */
    async logout() {
        try {
            // Call logout endpoint
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear auth regardless of API response
            this.clearAuth();

            // Show message
            if (window.app) {
                window.app.showStatus('Logged out successfully', 'info');
            }
        }
    }

    /**
     * Clear authentication
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        this.updateUI(false);
    }

    /**
     * Update UI based on auth state
     */
    updateUI(isLoggedIn) {
        if (isLoggedIn) {
            document.getElementById('auth-logged-out').style.display = 'none';
            document.getElementById('auth-logged-in').style.display = 'flex';
            document.getElementById('username-display').textContent = this.user.username;
        } else {
            document.getElementById('auth-logged-out').style.display = 'flex';
            document.getElementById('auth-logged-in').style.display = 'none';
        }
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Token expired or invalid
                this.clearAuth();
                throw new Error('Authentication required');
            }

            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.token !== null && this.user !== null;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }
}

// Create global auth instance
const auth = new AuthManager();

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

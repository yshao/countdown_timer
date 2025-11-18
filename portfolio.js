/**
 * Portfolio Management Module
 * Handles portfolio display, editing, and API communication
 */

class PortfolioAuthManager {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.session = null;
        this.init();
    }

    async init() {
        try {
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
                console.log('Portfolio auth state changed:', event);
                this.session = session;
                this.user = session?.user || null;

                if (session?.user) {
                    this.updateUI(true);
                    // Load portfolio after auth
                    await portfolio.loadPortfolio();
                } else {
                    this.updateUI(false);
                }
            });

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.user = session.user;
                this.updateUI(true);
                await portfolio.loadPortfolio();
            }
        } catch (error) {
            console.error('Portfolio auth initialization error:', error);
        }
    }

    updateUI(isLoggedIn) {
        const loggedOutSection = document.getElementById('auth-logged-out');
        const loggedInSection = document.getElementById('auth-logged-in');
        const loginRequired = document.getElementById('login-required');
        const portfolioContent = document.getElementById('portfolio-content');
        const usernameDisplay = document.getElementById('username-display');

        if (isLoggedIn && this.user) {
            loggedOutSection.style.display = 'none';
            loggedInSection.style.display = 'flex';
            loginRequired.style.display = 'none';
            portfolioContent.style.display = 'block';

            // Display username
            const username = this.user.user_metadata?.username || this.user.email?.split('@')[0] || 'User';
            usernameDisplay.textContent = username;
            document.getElementById('preview-username').textContent = username;
        } else {
            loggedOutSection.style.display = 'flex';
            loggedInSection.style.display = 'none';
            loginRequired.style.display = 'block';
            portfolioContent.style.display = 'none';
        }
    }

    getAccessToken() {
        return this.session?.access_token || null;
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

class PortfolioManager {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentPortfolio = null;
    }

    async loadPortfolio() {
        const token = portfolioAuth.getAccessToken();
        if (!token) {
            console.log('No auth token available');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/portfolio`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentPortfolio = data.portfolio;
                this.displayPortfolio(data.portfolio);
            } else {
                console.error('Failed to load portfolio:', response.statusText);
                this.showStatus('Failed to load portfolio', 'error');
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
            this.showStatus('Error loading portfolio', 'error');
        }
    }

    displayPortfolio(portfolioData) {
        const photoPreview = document.getElementById('portfolio-photo-preview');
        const photoPlaceholder = document.getElementById('photo-placeholder');
        const descriptionText = document.getElementById('portfolio-description-text');
        const photoUrlInput = document.getElementById('photo-url');
        const descriptionInput = document.getElementById('description');

        if (portfolioData) {
            // Display photo
            if (portfolioData.photo_url) {
                photoPreview.src = portfolioData.photo_url;
                photoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
                photoUrlInput.value = portfolioData.photo_url;
            } else {
                photoPreview.style.display = 'none';
                photoPlaceholder.style.display = 'flex';
                photoUrlInput.value = '';
            }

            // Display description
            if (portfolioData.description) {
                descriptionText.textContent = portfolioData.description;
                descriptionInput.value = portfolioData.description;
            } else {
                descriptionText.textContent = 'No description yet. Add one below!';
                descriptionInput.value = '';
            }
        } else {
            // No portfolio data
            photoPreview.style.display = 'none';
            photoPlaceholder.style.display = 'flex';
            photoUrlInput.value = '';
            descriptionText.textContent = 'No description yet. Add one below!';
            descriptionInput.value = '';
        }

        // Add photo URL preview listener
        photoUrlInput.addEventListener('input', () => {
            this.updatePhotoPreview(photoUrlInput.value);
        });
    }

    updatePhotoPreview(url) {
        const photoPreview = document.getElementById('portfolio-photo-preview');
        const photoPlaceholder = document.getElementById('photo-placeholder');

        if (url && url.trim()) {
            photoPreview.src = url;
            photoPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';

            // Handle image load error
            photoPreview.onerror = () => {
                photoPreview.style.display = 'none';
                photoPlaceholder.style.display = 'flex';
            };
        } else {
            photoPreview.style.display = 'none';
            photoPlaceholder.style.display = 'flex';
        }
    }

    async savePortfolio() {
        const token = portfolioAuth.getAccessToken();
        if (!token) {
            this.showStatus('Please login to save your portfolio', 'error');
            return;
        }

        const photoUrl = document.getElementById('photo-url').value.trim();
        const description = document.getElementById('description').value.trim();

        try {
            const response = await fetch(`${this.apiBaseUrl}/portfolio`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    photo_url: photoUrl,
                    description: description
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentPortfolio = data.portfolio;
                this.displayPortfolio(data.portfolio);
                this.showStatus('Portfolio saved successfully!', 'success');
            } else {
                const errorData = await response.json();
                this.showStatus(errorData.error || 'Failed to save portfolio', 'error');
            }
        } catch (error) {
            console.error('Error saving portfolio:', error);
            this.showStatus('Error saving portfolio', 'error');
        }
    }

    async clearPortfolio() {
        if (!confirm('Are you sure you want to clear your portfolio? This action cannot be undone.')) {
            return;
        }

        const token = portfolioAuth.getAccessToken();
        if (!token) {
            this.showStatus('Please login to clear your portfolio', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/portfolio`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.currentPortfolio = null;
                this.displayPortfolio(null);
                this.showStatus('Portfolio cleared successfully', 'success');
            } else {
                const errorData = await response.json();
                this.showStatus(errorData.error || 'Failed to clear portfolio', 'error');
            }
        } catch (error) {
            console.error('Error clearing portfolio:', error);
            this.showStatus('Error clearing portfolio', 'error');
        }
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('portfolio-status');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize managers
const portfolioAuth = new PortfolioAuthManager();
const portfolio = new PortfolioManager();

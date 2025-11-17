/**
 * Admin Panel Application Logic
 * Handles admin authentication, AI content generation, and panel management
 */

class AdminApp {
    constructor() {
        this.token = null;
        this.admin = null;
        this.apiBaseUrl = window.location.origin + '/api/admin';
        this.currentTab = 'ai-writing';

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Check for existing token
        this.token = localStorage.getItem('admin_token');

        if (this.token) {
            // Verify token
            this.verifyToken();
        } else {
            this.showLogin();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    }

    /**
     * Show login screen
     */
    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    /**
     * Show dashboard
     */
    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';

        // Update admin info in header
        if (this.admin) {
            document.getElementById('admin-name').textContent = this.admin.full_name || 'Admin';
            document.getElementById('admin-email').textContent = this.admin.email;
            document.getElementById('settings-email').textContent = this.admin.email;
            document.getElementById('settings-name').textContent = this.admin.full_name || 'N/A';
        }

        // Load default tab content
        this.switchTab('ai-writing');
    }

    /**
     * Handle login
     */
    async handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        errorEl.style.display = 'none';
        errorEl.textContent = '';

        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token and admin info
            this.token = data.token;
            this.admin = data.admin;
            localStorage.setItem('admin_token', this.token);

            // Show dashboard
            this.showDashboard();
            this.showToast('Login successful!', 'success');

        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Verify token
     */
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.admin = data.admin;
                this.showDashboard();
            } else {
                // Token invalid, show login
                this.logout();
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout();
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.apiBaseUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            this.admin = null;
            localStorage.removeItem('admin_token');
            this.showLogin();
            this.showToast('Logged out successfully', 'success');
        }
    }

    /**
     * Switch tabs
     */
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Load tab-specific data
        if (tabName === 'history') {
            this.loadHistory();
        } else if (tabName === 'activity') {
            this.loadActivity();
        }
    }

    /**
     * Generate AI content
     */
    async generateContent() {
        const prompt = document.getElementById('ai-prompt').value.trim();
        const model = document.getElementById('ai-model').value;
        const maxTokens = parseInt(document.getElementById('ai-max-tokens').value);

        if (!prompt) {
            this.showToast('Please enter a prompt', 'error');
            return;
        }

        const loadingEl = document.getElementById('generation-loading');
        const outputEl = document.getElementById('generated-content');
        const contentEl = document.getElementById('content-output');

        // Show loading
        loadingEl.style.display = 'block';
        outputEl.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    max_tokens: maxTokens
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            // Display generated content
            contentEl.textContent = data.content;
            outputEl.style.display = 'block';
            this.showToast('Content generated successfully!', 'success');

        } catch (error) {
            console.error('Generation error:', error);
            this.showToast(error.message, 'error');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Copy generated content to clipboard
     */
    copyContent() {
        const content = document.getElementById('content-output').textContent;

        navigator.clipboard.writeText(content).then(() => {
            this.showToast('Content copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Copy error:', err);
            this.showToast('Failed to copy content', 'error');
        });
    }

    /**
     * Download generated content as text file
     */
    downloadContent() {
        const content = document.getElementById('content-output').textContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-generated-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Content downloaded!', 'success');
    }

    /**
     * Load generation history
     */
    async loadHistory() {
        const loadingEl = document.getElementById('history-loading');
        const listEl = document.getElementById('history-list');
        const emptyEl = document.getElementById('history-empty');

        loadingEl.style.display = 'block';
        listEl.style.display = 'none';
        emptyEl.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/history?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load history');
            }

            if (data.history && data.history.length > 0) {
                listEl.innerHTML = data.history.map(item => this.renderHistoryItem(item)).join('');
                listEl.style.display = 'flex';
            } else {
                emptyEl.style.display = 'block';
            }

        } catch (error) {
            console.error('History load error:', error);
            this.showToast('Failed to load history', 'error');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Render history item
     */
    renderHistoryItem(item) {
        const date = new Date(item.created_at);
        const formattedDate = date.toLocaleString();

        return `
            <div class="history-item">
                <div class="history-header">
                    <div>
                        <div class="history-prompt">
                            📝 ${this.truncate(item.prompt, 100)}
                        </div>
                        <div class="history-meta">
                            <span>🕐 ${formattedDate}</span>
                            <span>🤖 ${item.model || 'Gemini'}</span>
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-sm" onclick="adminApp.copyToClipboard('${this.escapeHtml(item.generated_content)}')">
                            📋 Copy
                        </button>
                    </div>
                </div>
                <div class="history-content">
                    ${this.escapeHtml(this.truncate(item.generated_content, 300))}
                </div>
            </div>
        `;
    }

    /**
     * Load activity log
     */
    async loadActivity() {
        const loadingEl = document.getElementById('activity-loading');
        const listEl = document.getElementById('activity-list');
        const emptyEl = document.getElementById('activity-empty');

        loadingEl.style.display = 'block';
        listEl.style.display = 'none';
        emptyEl.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/activity?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load activity');
            }

            if (data.activities && data.activities.length > 0) {
                listEl.innerHTML = data.activities.map(item => this.renderActivityItem(item)).join('');
                listEl.style.display = 'flex';
            } else {
                emptyEl.style.display = 'block';
            }

        } catch (error) {
            console.error('Activity load error:', error);
            this.showToast('Failed to load activity', 'error');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Render activity item
     */
    renderActivityItem(item) {
        const date = new Date(item.created_at);
        const formattedDate = date.toLocaleString();

        const actionIcons = {
            'login': '🔑',
            'logout': '🚪',
            'ai_generate': '✨',
        };

        const icon = actionIcons[item.action] || '📌';

        return `
            <div class="activity-item">
                <div class="activity-header">
                    <div>
                        <div class="activity-action">
                            ${icon} ${item.action.replace('_', ' ').toUpperCase()}
                        </div>
                        <div class="activity-meta">
                            <span>🕐 ${formattedDate}</span>
                            ${item.ip_address ? `<span>🌐 ${item.ip_address}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${item.details && Object.keys(item.details).length > 0 ? `
                    <div class="activity-details">
                        ${JSON.stringify(item.details, null, 2)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Copy text to clipboard
     */
    copyToClipboard(text) {
        // Unescape HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        const decodedText = textarea.value;

        navigator.clipboard.writeText(decodedText).then(() => {
            this.showToast('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Copy error:', err);
            this.showToast('Failed to copy', 'error');
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('status-toast');
        toast.textContent = message;
        toast.className = `status-toast ${type}`;

        // Trigger reflow
        void toast.offsetWidth;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Truncate text
     */
    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
let adminApp;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adminApp = new AdminApp();
    });
} else {
    adminApp = new AdminApp();
}

/**
 * Stripe Integration Module
 * Handles subscription payments and checkout
 */

class StripeSubscriptionManager {
    constructor() {
        this.stripe = null;
        this.init();
    }

    /**
     * Initialize Stripe
     */
    async init() {
        try {
            // Load Stripe.js
            this.stripe = Stripe(window.CONFIG.stripe.publishableKey);
            console.log('Stripe initialized successfully');
        } catch (error) {
            console.error('Stripe initialization error:', error);
        }
    }

    /**
     * Create checkout session for subscription
     */
    async createCheckoutSession(planId) {
        if (!auth.isAuthenticated()) {
            auth.showLoginModal();
            return;
        }

        const plan = window.CONFIG.plans[planId];
        if (!plan || !plan.priceId) {
            console.error('Invalid plan or price ID');
            return;
        }

        try {
            // Show loading state
            if (window.app) {
                window.app.showStatus('Redirecting to checkout...', 'info');
            }

            // Call backend to create checkout session
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.session.access_token}`
                },
                body: JSON.stringify({
                    priceId: plan.priceId,
                    planId: planId,
                    userId: auth.user.id
                })
            });

            const data = await response.json();

            if (data.sessionId) {
                // Redirect to Stripe Checkout
                const { error } = await this.stripe.redirectToCheckout({
                    sessionId: data.sessionId
                });

                if (error) {
                    console.error('Stripe redirect error:', error);
                    if (window.app) {
                        window.app.showStatus('Checkout failed. Please try again.', 'error');
                    }
                }
            } else {
                throw new Error(data.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            if (window.app) {
                window.app.showStatus('Failed to start checkout. Please try again.', 'error');
            }
        }
    }

    /**
     * Create portal session for managing subscription
     */
    async openCustomerPortal() {
        if (!auth.isAuthenticated()) {
            auth.showLoginModal();
            return;
        }

        try {
            // Show loading state
            if (window.app) {
                window.app.showStatus('Opening billing portal...', 'info');
            }

            // Call backend to create portal session
            const response = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.session.access_token}`
                },
                body: JSON.stringify({
                    userId: auth.user.id
                })
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Customer Portal
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create portal session');
            }
        } catch (error) {
            console.error('Portal error:', error);
            if (window.app) {
                window.app.showStatus('Failed to open billing portal. Please try again.', 'error');
            }
        }
    }

    /**
     * Show pricing modal
     */
    showPricingModal() {
        document.getElementById('pricing-modal').style.display = 'block';
        this.updatePricingUI();
    }

    /**
     * Update pricing UI based on current subscription
     */
    updatePricingUI() {
        const currentPlan = auth.subscription?.plan || 'free';

        // Update all plan cards
        Object.keys(window.CONFIG.plans).forEach(planId => {
            const button = document.querySelector(`[data-plan="${planId}"]`);
            if (button) {
                if (planId === currentPlan) {
                    button.textContent = 'Current Plan';
                    button.disabled = true;
                    button.classList.add('current-plan');
                } else {
                    button.textContent = planId === 'free' ? 'Downgrade' : 'Upgrade';
                    button.disabled = false;
                    button.classList.remove('current-plan');
                }
            }
        });
    }

    /**
     * Update subscription UI in header
     */
    updateSubscriptionUI(subscription) {
        const subscriptionEl = document.getElementById('subscription-info');
        if (!subscriptionEl) return;

        if (subscription) {
            const plan = window.CONFIG.plans[subscription.plan];
            subscriptionEl.textContent = `${plan.name} Plan`;
            subscriptionEl.className = `subscription-badge ${subscription.plan}`;
            subscriptionEl.style.display = 'inline-block';
        } else {
            subscriptionEl.style.display = 'none';
        }
    }

    /**
     * Handle successful subscription
     */
    async handleSubscriptionSuccess(sessionId) {
        try {
            // Reload subscription data
            await auth.loadSubscription();

            // Show success message
            if (window.app) {
                window.app.showStatus('Subscription updated successfully!', 'success');
            }

            // Close pricing modal
            auth.closeModals();
        } catch (error) {
            console.error('Error handling subscription success:', error);
        }
    }
}

// Create global subscription manager instance
const subscriptionManager = new StripeSubscriptionManager();

// Expose to window for access from auth manager
window.subscriptionManager = subscriptionManager;

// Check for successful payment on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');

    if (sessionId && success === 'true') {
        subscriptionManager.handleSubscriptionSuccess(sessionId);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

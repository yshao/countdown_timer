# Stripe Integration Setup

This guide explains how to set up Stripe for subscription payments in the Countdown Timer SaaS application.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Complete business verification (required for live mode)
3. Have your Supabase database set up (see SUPABASE_SETUP.md)

## Step 1: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** and **Secret key**
3. Add them to your `.env` file:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Step 2: Create Products and Prices

### Option A: Using Stripe Dashboard (Recommended)

1. **Go to Products** (https://dashboard.stripe.com/test/products)

2. **Create Pro Plan**
   - Click "Add product"
   - Name: "Pro Plan"
   - Description: "Professional tier with unlimited features"
   - Pricing model: "Recurring"
   - Price: $9.99
   - Billing period: Monthly
   - Click "Save product"
   - Copy the **Price ID** (starts with `price_`)

3. **Create Premium Plan**
   - Repeat the same process
   - Name: "Premium Plan"
   - Description: "Enterprise tier with team features"
   - Price: $19.99
   - Billing period: Monthly
   - Copy the **Price ID**

4. **Update your `.env` file:**

```env
STRIPE_PRICE_PRO=price_xxx_for_pro_plan
STRIPE_PRICE_PREMIUM=price_xxx_for_premium_plan
```

### Option B: Using Stripe CLI

```bash
# Create Pro Plan
stripe products create \
  --name="Pro Plan" \
  --description="Professional tier with unlimited features"

# Note the product ID, then create price
stripe prices create \
  --product=prod_xxx \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month

# Create Premium Plan
stripe products create \
  --name="Premium Plan" \
  --description="Enterprise tier with team features"

stripe prices create \
  --product=prod_yyy \
  --unit-amount=1999 \
  --currency=usd \
  --recurring[interval]=month
```

## Step 3: Update Frontend Configuration

1. **Edit `config.js`** and update the Stripe price IDs:

```javascript
const SUBSCRIPTION_PLANS = {
    pro: {
        // ...
        priceId: 'price_xxx_your_pro_price_id',
        // ...
    },
    premium: {
        // ...
        priceId: 'price_yyy_your_premium_price_id',
        // ...
    }
};
```

2. **Or use environment variables:**

Create a `public/env.js` file:

```javascript
window.ENV = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
    STRIPE_PRICE_PRO: 'price_xxx',
    STRIPE_PRICE_PREMIUM: 'price_yyy'
};
```

Include it in your HTML before other scripts:
```html
<script src="env.js"></script>
```

## Step 4: Set Up Webhook

Webhooks allow Stripe to notify your server when subscription events occur (payments, cancellations, etc.).

### For Development (Using Stripe CLI)

1. **Install Stripe CLI**
   - Download from https://stripe.com/docs/stripe-cli
   - Or use: `brew install stripe/stripe-cli/stripe` (Mac)

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**
   ```bash
   stripe listen --forward-to http://localhost:5000/api/stripe/webhook
   ```

4. **Copy the webhook secret** (starts with `whsec_`)
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

### For Production

1. **Go to Webhooks** (https://dashboard.stripe.com/test/webhooks)

2. **Add an endpoint**
   - Click "Add endpoint"
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Description: "Subscription events"

3. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copy the Signing Secret**
   - After creating the endpoint, reveal and copy the signing secret
   - Add to your production `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx_production
   ```

## Step 5: Configure Checkout Success/Cancel URLs

Update the success and cancel URLs in `backend/stripe_routes.py`:

```python
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')
```

Set in your `.env`:
```env
# Development
FRONTEND_URL=http://localhost:5000

# Production
FRONTEND_URL=https://yourdomain.com
```

## Step 6: Test the Integration

1. **Start your application**
   ```bash
   cd backend
   python app.py
   ```

2. **In another terminal, forward webhooks (if in dev)**
   ```bash
   stripe listen --forward-to http://localhost:5000/api/stripe/webhook
   ```

3. **Test the checkout flow**
   - Register a new user
   - Click "Upgrade" and select Pro or Premium
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date for expiry
   - Any 3 digits for CVC
   - Any zip code

4. **Verify subscription was created**
   - Check Supabase subscriptions table
   - Check Stripe dashboard for the subscription
   - User should see their new plan in the app

## Stripe Test Cards

Use these test cards for different scenarios:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

For all test cards:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any valid ZIP code

## Customer Portal

The Customer Portal allows users to:
- View invoices
- Update payment methods
- Cancel subscriptions
- Update billing information

It's already configured in the code via `subscriptionManager.openCustomerPortal()`.

To customize it:
1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Customize branding, allowed actions, etc.

## Going Live

When ready to accept real payments:

1. **Complete business verification** in Stripe Dashboard

2. **Switch to live mode**
   - Get live API keys from https://dashboard.stripe.com/apikeys
   - Create products/prices in live mode
   - Set up live webhook endpoint

3. **Update environment variables**
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRICE_PRO=price_live_xxx
   STRIPE_PRICE_PREMIUM=price_live_yyy
   STRIPE_WEBHOOK_SECRET=whsec_live_xxx
   ```

4. **Test thoroughly** with real cards (use small amounts)

5. **Set up proper error monitoring** and logging

## Troubleshooting

### Checkout session not created
- Verify Stripe secret key is correct
- Check backend logs for errors
- Ensure price IDs are correct

### Webhook not receiving events
- Verify webhook endpoint is accessible
- Check webhook signing secret is correct
- Use Stripe CLI to test locally

### Subscription not updating in database
- Check Supabase service key is correct
- Verify RLS policies allow service role access
- Check webhook handler logs

### Customer Portal not opening
- Ensure user has a Stripe customer ID
- Verify customer portal is enabled in Stripe settings
- Check backend logs for errors

## Security Best Practices

1. **Never expose your secret key** in frontend code
2. **Always verify webhook signatures** using the signing secret
3. **Use HTTPS** in production
4. **Implement rate limiting** on webhook endpoints
5. **Log all payment events** for auditing
6. **Validate all amounts** server-side
7. **Never trust client-side data** for pricing

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Support: https://support.stripe.com
- Status: https://status.stripe.com

"""
Stripe Integration Routes for Payment Processing
"""
import os
import stripe
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Create Blueprint
stripe_bp = Blueprint('stripe', __name__)

# Webhook secret for verifying Stripe events
WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

# Frontend URL for redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')


@stripe_bp.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create a Stripe checkout session for subscription"""
    try:
        data = request.get_json()
        price_id = data.get('priceId')
        plan_id = data.get('planId')
        user_id = data.get('userId')

        if not all([price_id, plan_id, user_id]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{FRONTEND_URL}/?success=true&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{FRONTEND_URL}/?canceled=true',
            client_reference_id=user_id,
            metadata={
                'user_id': user_id,
                'plan_id': plan_id
            }
        )

        return jsonify({'sessionId': session.id}), 200

    except Exception as e:
        print(f'Error creating checkout session: {str(e)}')
        return jsonify({'error': str(e)}), 500


@stripe_bp.route('/create-portal-session', methods=['POST'])
def create_portal_session():
    """Create a Stripe customer portal session"""
    try:
        data = request.get_json()
        user_id = data.get('userId')

        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # Get customer ID from Supabase (you'll need to query this)
        # For now, we'll assume it's stored in the subscriptions table
        from supabase import create_client

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        supabase = create_client(supabase_url, supabase_key)

        # Get subscription record
        result = supabase.table('subscriptions').select('stripe_customer_id').eq('user_id', user_id).single().execute()

        if not result.data or not result.data.get('stripe_customer_id'):
            return jsonify({'error': 'No active subscription found'}), 404

        customer_id = result.data['stripe_customer_id']

        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=FRONTEND_URL,
        )

        return jsonify({'url': session.url}), 200

    except Exception as e:
        print(f'Error creating portal session: {str(e)}')
        return jsonify({'error': str(e)}), 500


@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        print(f'Invalid payload: {str(e)}')
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f'Invalid signature: {str(e)}')
        return jsonify({'error': 'Invalid signature'}), 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        handle_checkout_completed(event['data']['object'])

    elif event['type'] == 'customer.subscription.updated':
        handle_subscription_updated(event['data']['object'])

    elif event['type'] == 'customer.subscription.deleted':
        handle_subscription_deleted(event['data']['object'])

    elif event['type'] == 'invoice.payment_succeeded':
        handle_payment_succeeded(event['data']['object'])

    elif event['type'] == 'invoice.payment_failed':
        handle_payment_failed(event['data']['object'])

    return jsonify({'success': True}), 200


def handle_checkout_completed(session):
    """Handle successful checkout"""
    try:
        from supabase import create_client

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        supabase = create_client(supabase_url, supabase_key)

        user_id = session.get('metadata', {}).get('user_id') or session.get('client_reference_id')
        plan_id = session.get('metadata', {}).get('plan_id')
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')

        if not user_id:
            print('No user_id found in checkout session')
            return

        # Update subscription in Supabase
        supabase.table('subscriptions').upsert({
            'user_id': user_id,
            'plan': plan_id,
            'status': 'active',
            'stripe_customer_id': customer_id,
            'stripe_subscription_id': subscription_id,
            'updated_at': 'now()'
        }).execute()

        print(f'Subscription created/updated for user {user_id}')

    except Exception as e:
        print(f'Error handling checkout completed: {str(e)}')


def handle_subscription_updated(subscription):
    """Handle subscription update"""
    try:
        from supabase import create_client

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        supabase = create_client(supabase_url, supabase_key)

        subscription_id = subscription['id']
        status = subscription['status']

        # Map Stripe status to our status
        our_status = 'active' if status in ['active', 'trialing'] else 'inactive'

        # Update subscription status
        supabase.table('subscriptions').update({
            'status': our_status,
            'updated_at': 'now()'
        }).eq('stripe_subscription_id', subscription_id).execute()

        print(f'Subscription {subscription_id} updated to {our_status}')

    except Exception as e:
        print(f'Error handling subscription updated: {str(e)}')


def handle_subscription_deleted(subscription):
    """Handle subscription cancellation"""
    try:
        from supabase import create_client

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        supabase = create_client(supabase_url, supabase_key)

        subscription_id = subscription['id']

        # Downgrade to free plan
        supabase.table('subscriptions').update({
            'plan': 'free',
            'status': 'active',
            'stripe_subscription_id': None,
            'updated_at': 'now()'
        }).eq('stripe_subscription_id', subscription_id).execute()

        print(f'Subscription {subscription_id} cancelled, downgraded to free')

    except Exception as e:
        print(f'Error handling subscription deleted: {str(e)}')


def handle_payment_succeeded(invoice):
    """Handle successful payment"""
    try:
        print(f'Payment succeeded for invoice {invoice["id"]}')
        # Add any additional logic here (e.g., send receipt email)
    except Exception as e:
        print(f'Error handling payment succeeded: {str(e)}')


def handle_payment_failed(invoice):
    """Handle failed payment"""
    try:
        print(f'Payment failed for invoice {invoice["id"]}')
        # Add any additional logic here (e.g., send payment failed email)

        from supabase import create_client

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        supabase = create_client(supabase_url, supabase_key)

        subscription_id = invoice.get('subscription')

        # Update status to indicate payment issue
        supabase.table('subscriptions').update({
            'status': 'past_due',
            'updated_at': 'now()'
        }).eq('stripe_subscription_id', subscription_id).execute()

    except Exception as e:
        print(f'Error handling payment failed: {str(e)}')

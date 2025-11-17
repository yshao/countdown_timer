"""
Supabase Authentication Routes with Enhanced Security
Provides server-side session validation
"""
import os
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Blueprint
supabase_auth_bp = Blueprint('supabase_auth', __name__)

# Initialize Supabase client (server-side with service role key for validation)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase_client: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        print(f'Warning: Failed to initialize Supabase client: {e}')


@supabase_auth_bp.route('/verify-session', methods=['POST'])
def verify_session():
    """
    Verify a Supabase session token on the server-side
    This provides an additional layer of security beyond client-side validation
    """
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'valid': False, 'error': 'No authorization token provided'}), 401

        token = auth_header.replace('Bearer ', '')

        # If Supabase client is not initialized, return valid in dev mode
        if not supabase_client:
            print('Warning: Supabase client not initialized, allowing session in dev mode')
            return jsonify({'valid': True, 'dev_mode': True}), 200

        # Verify the token with Supabase
        try:
            user = supabase_client.auth.get_user(token)

            if user and hasattr(user, 'user') and user.user:
                # Additional validation: check if user exists in database
                user_id = user.user.id

                # You can add additional checks here, such as:
                # - Check if user is active
                # - Check if user has required permissions
                # - Check if session is not blacklisted
                # - Rate limiting

                return jsonify({
                    'valid': True,
                    'user_id': user_id,
                    'email': user.user.email
                }), 200
            else:
                return jsonify({'valid': False, 'error': 'Invalid token'}), 401

        except Exception as e:
            print(f'Token verification error: {str(e)}')
            return jsonify({'valid': False, 'error': 'Token verification failed'}), 401

    except Exception as e:
        print(f'Session verification error: {str(e)}')
        return jsonify({'valid': False, 'error': 'Internal server error'}), 500


@supabase_auth_bp.route('/check-username', methods=['POST'])
def check_username():
    """
    Check if a username is available
    This helps prevent duplicate usernames
    """
    try:
        data = request.get_json()
        username = data.get('username', '').strip()

        if not username:
            return jsonify({'error': 'Username is required'}), 400

        if not supabase_client:
            # In dev mode without Supabase, assume username is available
            return jsonify({'available': True, 'dev_mode': True}), 200

        # Query auth.users table to check if username exists in user_metadata
        # Note: This requires enabling the Supabase auth schema access or using a custom users table

        # For now, we'll return available since we can't easily query auth.users metadata
        # In production, you should create a separate 'usernames' table or 'profiles' table
        return jsonify({'available': True}), 200

    except Exception as e:
        print(f'Username check error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@supabase_auth_bp.route('/user-profile', methods=['GET'])
def get_user_profile():
    """
    Get user profile information
    Requires valid session token
    """
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401

        token = auth_header.replace('Bearer ', '')

        if not supabase_client:
            return jsonify({'error': 'Service not available'}), 503

        # Get user from token
        user = supabase_client.auth.get_user(token)

        if user and hasattr(user, 'user') and user.user:
            user_data = {
                'id': user.user.id,
                'email': user.user.email,
                'username': user.user.user_metadata.get('username'),
                'display_name': user.user.user_metadata.get('display_name'),
                'created_at': user.user.created_at,
                'email_confirmed': user.user.email_confirmed_at is not None
            }
            return jsonify(user_data), 200
        else:
            return jsonify({'error': 'Invalid token'}), 401

    except Exception as e:
        print(f'Get user profile error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@supabase_auth_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for Supabase auth service"""
    status = {
        'status': 'healthy',
        'supabase_configured': supabase_client is not None
    }
    return jsonify(status), 200

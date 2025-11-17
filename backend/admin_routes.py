"""
Admin Routes for Admin Panel
Handles admin authentication, AI writing, and admin-specific operations
"""
from flask import Blueprint, request, jsonify
import os
import jwt as pyjwt
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
import google.generativeai as genai
from supabase import create_client, Client

admin_bp = Blueprint('admin', __name__)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL', '')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY', '')
supabase: Client = None

if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")

# Initialize Google Gemini client
gemini_client = None
google_api_key = os.getenv('GOOGLE_API_KEY', '')
if google_api_key:
    try:
        genai.configure(api_key=google_api_key)
        gemini_client = genai.GenerativeModel('gemini-2.0-flash-exp')
        print("✓ Google Gemini API initialized")
    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")


def hash_password(password: str) -> str:
    """Simple password hashing using SHA256 (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash


def generate_token(admin_id: str, email: str) -> str:
    """Generate JWT token for admin"""
    secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
    expiration = datetime.utcnow() + timedelta(hours=24)

    payload = {
        'admin_id': admin_id,
        'email': email,
        'exp': expiration,
        'iat': datetime.utcnow()
    }

    return pyjwt.encode(payload, secret_key, algorithm='HS256')


def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
        payload = pyjwt.decode(token, secret_key, algorithms=['HS256'])
        return payload
    except pyjwt.ExpiredSignatureError:
        return None
    except pyjwt.InvalidTokenError:
        return None


def require_admin_auth(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401

        try:
            token = auth_header.split(' ')[1]  # Bearer <token>
            payload = verify_token(token)

            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            request.admin_id = payload['admin_id']
            request.admin_email = payload['email']

            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication failed'}), 401

    return decorated_function


def init_admin_user():
    """Initialize default admin user if not exists"""
    if not supabase:
        print("Warning: Supabase not configured. Admin user creation skipped.")
        return

    try:
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'Admin123!')

        # Check if admin exists
        response = supabase.table('admin_users').select('*').eq('email', admin_email).execute()

        if not response.data:
            # Create admin user
            password_hash = hash_password(admin_password)
            supabase.table('admin_users').insert({
                'email': admin_email,
                'password_hash': password_hash,
                'full_name': 'System Administrator',
                'is_active': True
            }).execute()
            print(f"✓ Admin user created: {admin_email}")
        else:
            print(f"✓ Admin user already exists: {admin_email}")
    except Exception as e:
        print(f"Error initializing admin user: {e}")


def log_activity(admin_id: str, action: str, details: dict = None):
    """Log admin activity"""
    if not supabase:
        return

    try:
        supabase.table('admin_activity_log').insert({
            'admin_id': admin_id,
            'action': action,
            'details': details or {},
            'ip_address': request.remote_addr
        }).execute()
    except Exception as e:
        print(f"Error logging activity: {e}")


# =============================================================================
# Admin Authentication Routes
# =============================================================================

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    email = data['email']
    password = data['password']

    if not supabase:
        return jsonify({'error': 'Admin system not configured'}), 500

    try:
        # Get admin user
        response = supabase.table('admin_users').select('*').eq('email', email).eq('is_active', True).execute()

        if not response.data:
            return jsonify({'error': 'Invalid credentials'}), 401

        admin = response.data[0]

        # Verify password
        if not verify_password(password, admin['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate token
        token = generate_token(admin['id'], admin['email'])

        # Update last login
        supabase.table('admin_users').update({
            'last_login': datetime.utcnow().isoformat()
        }).eq('id', admin['id']).execute()

        # Log activity
        log_activity(admin['id'], 'login', {'email': email})

        return jsonify({
            'success': True,
            'token': token,
            'admin': {
                'id': admin['id'],
                'email': admin['email'],
                'full_name': admin['full_name']
            }
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500


@admin_bp.route('/verify', methods=['GET'])
@require_admin_auth
def verify_admin():
    """Verify admin token"""
    if not supabase:
        return jsonify({'error': 'Admin system not configured'}), 500

    try:
        response = supabase.table('admin_users').select('*').eq('id', request.admin_id).execute()

        if not response.data:
            return jsonify({'error': 'Admin not found'}), 404

        admin = response.data[0]

        return jsonify({
            'valid': True,
            'admin': {
                'id': admin['id'],
                'email': admin['email'],
                'full_name': admin['full_name']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Verification failed'}), 500


@admin_bp.route('/logout', methods=['POST'])
@require_admin_auth
def admin_logout():
    """Admin logout endpoint"""
    log_activity(request.admin_id, 'logout', {})
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200


# =============================================================================
# AI Writing Routes
# =============================================================================

@admin_bp.route('/ai/generate', methods=['POST'])
@require_admin_auth
def generate_content():
    """Generate content using AI"""
    data = request.get_json()

    if not data or not data.get('prompt'):
        return jsonify({'error': 'Prompt is required'}), 400

    if not gemini_client:
        return jsonify({'error': 'AI service not configured. Please set GOOGLE_API_KEY in .env'}), 500

    prompt = data['prompt']
    model_name = data.get('model', 'gemini-2.0-flash-exp')
    max_tokens = data.get('max_tokens', 2000)

    try:
        # Select the appropriate Gemini model
        if model_name != gemini_client.model_name:
            model = genai.GenerativeModel(model_name)
        else:
            model = gemini_client

        # Configure generation settings
        generation_config = {
            'max_output_tokens': max_tokens,
            'temperature': 0.7,
        }

        # Generate content using Gemini
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )

        generated_content = response.text

        # Calculate token usage (approximate)
        token_count = len(generated_content.split())  # Rough estimate

        # Save to database
        if supabase:
            try:
                supabase.table('ai_generated_content').insert({
                    'admin_id': request.admin_id,
                    'prompt': prompt,
                    'generated_content': generated_content,
                    'model': model_name,
                    'metadata': {
                        'tokens': token_count,
                        'model_version': model_name
                    }
                }).execute()
            except Exception as e:
                print(f"Error saving AI content: {e}")

        # Log activity
        log_activity(request.admin_id, 'ai_generate', {
            'prompt_length': len(prompt),
            'response_length': len(generated_content),
            'model': model_name
        })

        return jsonify({
            'success': True,
            'content': generated_content,
            'model': model_name
        }), 200

    except Exception as e:
        print(f"AI generation error: {e}")
        return jsonify({'error': f'Failed to generate content: {str(e)}'}), 500


@admin_bp.route('/ai/history', methods=['GET'])
@require_admin_auth
def get_ai_history():
    """Get AI generation history"""
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500

    try:
        limit = request.args.get('limit', 20, type=int)

        response = supabase.table('ai_generated_content')\
            .select('*')\
            .eq('admin_id', request.admin_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()

        return jsonify({
            'success': True,
            'history': response.data
        }), 200

    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({'error': 'Failed to fetch history'}), 500


# =============================================================================
# Admin Activity Routes
# =============================================================================

@admin_bp.route('/activity', methods=['GET'])
@require_admin_auth
def get_activity_log():
    """Get admin activity log"""
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500

    try:
        limit = request.args.get('limit', 50, type=int)

        response = supabase.table('admin_activity_log')\
            .select('*')\
            .eq('admin_id', request.admin_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()

        return jsonify({
            'success': True,
            'activities': response.data
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch activity log'}), 500


# Initialize admin user on module load
init_admin_user()

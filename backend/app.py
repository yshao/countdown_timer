"""
Flask API for Countdown Timer with User Authentication
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from datetime import timedelta
import os
from dotenv import load_dotenv

from models import Database, User, UserPreferences, UserPresets
from stripe_routes import stripe_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-me')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Enable CORS
CORS(app)

# Initialize JWT
jwt = JWTManager(app)

# Initialize database
db_path = os.getenv('DATABASE_PATH', 'timer_app.db')
db = Database(db_path)
user_model = User(db)
preferences_model = UserPreferences(db)
presets_model = UserPresets(db)

# Register Stripe routes blueprint
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')

# Token blacklist for logout functionality
token_blacklist = set()


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if token is revoked"""
    jti = jwt_payload['jti']
    return jti in token_blacklist


# =============================================================================
# Authentication Endpoints
# =============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()

    # Validation
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required'}), 400

    username = data['username']
    email = data['email']
    password = data['password']

    # Validate username length
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400

    # Validate password length
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Create user
    user_id = user_model.create_user(username, email, password)

    if user_id:
        # Set default preferences
        default_prefs = {
            'voice_enabled': 'true',
            'default_hours': '0',
            'default_minutes': '1',
            'default_seconds': '0'
        }
        preferences_model.set_multiple_preferences(user_id, default_prefs)

        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
    else:
        return jsonify({'error': 'Username or email already exists'}), 409


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400

    username = data['username']
    password = data['password']

    # Verify credentials
    user = user_model.verify_password(username, password)

    if user:
        # Create access token
        access_token = create_access_token(identity=user['id'])

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        }), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401


@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (blacklist token)"""
    jti = get_jwt()['jti']
    token_blacklist.add(jti)

    return jsonify({'message': 'Logout successful'}), 200


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)

    if user:
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'created_at': user['created_at'],
            'last_login': user['last_login']
        }), 200
    else:
        return jsonify({'error': 'User not found'}), 404


# =============================================================================
# User Preferences Endpoints
# =============================================================================

@app.route('/api/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get all preferences for current user"""
    user_id = get_jwt_identity()
    preferences = preferences_model.get_preferences(user_id)

    return jsonify({'preferences': preferences}), 200


@app.route('/api/preferences', methods=['POST'])
@jwt_required()
def set_preferences():
    """Set preferences for current user"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'preferences' not in data:
        return jsonify({'error': 'Preferences object is required'}), 400

    preferences = data['preferences']

    # Set preferences
    preferences_model.set_multiple_preferences(user_id, preferences)

    return jsonify({'message': 'Preferences updated successfully'}), 200


@app.route('/api/preferences/<key>', methods=['PUT'])
@jwt_required()
def set_preference(key):
    """Set a single preference"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'value' not in data:
        return jsonify({'error': 'Value is required'}), 400

    value = str(data['value'])

    preferences_model.set_preference(user_id, key, value)

    return jsonify({'message': 'Preference updated successfully'}), 200


@app.route('/api/preferences/<key>', methods=['DELETE'])
@jwt_required()
def delete_preference(key):
    """Delete a preference"""
    user_id = get_jwt_identity()

    preferences_model.delete_preference(user_id, key)

    return jsonify({'message': 'Preference deleted successfully'}), 200


# =============================================================================
# User Presets Endpoints
# =============================================================================

@app.route('/api/presets', methods=['GET'])
@jwt_required()
def get_presets():
    """Get all timer presets for current user"""
    user_id = get_jwt_identity()
    presets = presets_model.get_presets(user_id)

    return jsonify({'presets': presets}), 200


@app.route('/api/presets', methods=['POST'])
@jwt_required()
def create_preset():
    """Create a new timer preset"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validation
    if not data or not data.get('name'):
        return jsonify({'error': 'Preset name is required'}), 400

    name = data['name']
    hours = int(data.get('hours', 0))
    minutes = int(data.get('minutes', 0))
    seconds = int(data.get('seconds', 0))

    # Validate time values
    if hours < 0 or hours > 23:
        return jsonify({'error': 'Hours must be between 0 and 23'}), 400
    if minutes < 0 or minutes > 59:
        return jsonify({'error': 'Minutes must be between 0 and 59'}), 400
    if seconds < 0 or seconds > 59:
        return jsonify({'error': 'Seconds must be between 0 and 59'}), 400

    preset_id = presets_model.create_preset(user_id, name, hours, minutes, seconds)

    return jsonify({
        'message': 'Preset created successfully',
        'preset_id': preset_id
    }), 201


@app.route('/api/presets/<int:preset_id>', methods=['PUT'])
@jwt_required()
def update_preset(preset_id):
    """Update a timer preset"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('name'):
        return jsonify({'error': 'Preset name is required'}), 400

    name = data['name']
    hours = int(data.get('hours', 0))
    minutes = int(data.get('minutes', 0))
    seconds = int(data.get('seconds', 0))

    presets_model.update_preset(user_id, preset_id, name, hours, minutes, seconds)

    return jsonify({'message': 'Preset updated successfully'}), 200


@app.route('/api/presets/<int:preset_id>', methods=['DELETE'])
@jwt_required()
def delete_preset(preset_id):
    """Delete a timer preset"""
    user_id = get_jwt_identity()

    presets_model.delete_preset(user_id, preset_id)

    return jsonify({'message': 'Preset deleted successfully'}), 200


# =============================================================================
# Health Check
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Timer API is running'}), 200


# =============================================================================
# Error Handlers
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Get port from environment (for Railway, Heroku, etc.)
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)

# Vercel serverless handler
app_handler = app

"""
Backend API Tests for Countdown Timer
Tests authentication, preferences, and presets endpoints
"""
import pytest
import json
import os
import sys
from app import app, db, user_model, preferences_model, presets_model


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'

    # Use test database
    test_db_path = 'test_timer_app.db'
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    with app.test_client() as client:
        yield client

    # Cleanup
    if os.path.exists(test_db_path):
        os.remove(test_db_path)


@pytest.fixture
def auth_headers(client):
    """Create authenticated user and return auth headers"""
    # Register user
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    })

    # Login
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })

    token = response.get_json()['access_token']

    return {'Authorization': f'Bearer {token}'}


class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self, client):
        """Should return healthy status"""
        response = client.get('/api/health')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] == 'healthy'


class TestAuthentication:
    """Test authentication endpoints"""

    def test_register_success(self, client):
        """Should register a new user successfully"""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123'
        })

        assert response.status_code == 201
        data = response.get_json()
        assert 'user_id' in data
        assert data['message'] == 'User registered successfully'

    def test_register_missing_fields(self, client):
        """Should fail with missing fields"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser'
        })

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_register_short_username(self, client):
        """Should fail with short username"""
        response = client.post('/api/auth/register', json={
            'username': 'ab',
            'email': 'test@test.com',
            'password': 'password123'
        })

        assert response.status_code == 400
        data = response.get_json()
        assert 'Username must be at least 3 characters' in data['error']

    def test_register_short_password(self, client):
        """Should fail with short password"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@test.com',
            'password': '12345'
        })

        assert response.status_code == 400
        data = response.get_json()
        assert 'Password must be at least 6 characters' in data['error']

    def test_register_duplicate_username(self, client):
        """Should fail with duplicate username"""
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test1@example.com',
            'password': 'password123'
        })

        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test2@example.com',
            'password': 'password123'
        })

        assert response.status_code == 409
        data = response.get_json()
        assert 'already exists' in data['error']

    def test_login_success(self, client):
        """Should login successfully"""
        # Register first
        client.post('/api/auth/register', json={
            'username': 'loginuser',
            'email': 'login@example.com',
            'password': 'password123'
        })

        # Login
        response = client.post('/api/auth/login', json={
            'username': 'loginuser',
            'password': 'password123'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['username'] == 'loginuser'

    def test_login_invalid_credentials(self, client):
        """Should fail with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'wrongpass'
        })

        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid username or password' in data['error']

    def test_get_current_user(self, client, auth_headers):
        """Should get current authenticated user"""
        response = client.get('/api/auth/me', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@example.com'

    def test_get_current_user_unauthorized(self, client):
        """Should fail without auth token"""
        response = client.get('/api/auth/me')

        assert response.status_code == 401

    def test_logout(self, client, auth_headers):
        """Should logout successfully"""
        response = client.post('/api/auth/logout', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Logout successful'

        # Should not be able to use same token after logout
        response = client.get('/api/auth/me', headers=auth_headers)
        assert response.status_code == 401


class TestPreferences:
    """Test user preferences endpoints"""

    def test_get_default_preferences(self, client, auth_headers):
        """Should get default preferences after registration"""
        response = client.get('/api/preferences', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert 'preferences' in data
        assert data['preferences']['voice_enabled'] == 'true'
        assert data['preferences']['default_hours'] == '0'
        assert data['preferences']['default_minutes'] == '1'

    def test_set_preferences(self, client, auth_headers):
        """Should set multiple preferences"""
        response = client.post('/api/preferences', headers=auth_headers, json={
            'preferences': {
                'voice_enabled': 'false',
                'default_hours': '1',
                'default_minutes': '30',
                'custom_setting': 'test_value'
            }
        })

        assert response.status_code == 200

        # Verify preferences were set
        response = client.get('/api/preferences', headers=auth_headers)
        data = response.get_json()
        prefs = data['preferences']

        assert prefs['voice_enabled'] == 'false'
        assert prefs['default_hours'] == '1'
        assert prefs['default_minutes'] == '30'
        assert prefs['custom_setting'] == 'test_value'

    def test_set_single_preference(self, client, auth_headers):
        """Should set a single preference"""
        response = client.put('/api/preferences/voice_enabled',
                             headers=auth_headers,
                             json={'value': 'false'})

        assert response.status_code == 200

        # Verify preference was set
        response = client.get('/api/preferences', headers=auth_headers)
        data = response.get_json()
        assert data['preferences']['voice_enabled'] == 'false'

    def test_delete_preference(self, client, auth_headers):
        """Should delete a preference"""
        # Set a preference first
        client.put('/api/preferences/custom_key',
                  headers=auth_headers,
                  json={'value': 'custom_value'})

        # Delete it
        response = client.delete('/api/preferences/custom_key',
                                headers=auth_headers)

        assert response.status_code == 200

        # Verify it was deleted
        response = client.get('/api/preferences', headers=auth_headers)
        data = response.get_json()
        assert 'custom_key' not in data['preferences']

    def test_preferences_require_auth(self, client):
        """Should require authentication for preferences"""
        response = client.get('/api/preferences')
        assert response.status_code == 401


class TestPresets:
    """Test user presets endpoints"""

    def test_get_presets_empty(self, client, auth_headers):
        """Should return empty presets for new user"""
        response = client.get('/api/presets', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert 'presets' in data
        assert len(data['presets']) == 0

    def test_create_preset(self, client, auth_headers):
        """Should create a new preset"""
        response = client.post('/api/presets', headers=auth_headers, json={
            'name': 'Quick Break',
            'hours': 0,
            'minutes': 5,
            'seconds': 0
        })

        assert response.status_code == 201
        data = response.get_json()
        assert 'preset_id' in data

        # Verify preset was created
        response = client.get('/api/presets', headers=auth_headers)
        data = response.get_json()
        assert len(data['presets']) == 1
        assert data['presets'][0]['name'] == 'Quick Break'
        assert data['presets'][0]['minutes'] == 5

    def test_create_preset_validation(self, client, auth_headers):
        """Should validate preset time values"""
        # Invalid hours
        response = client.post('/api/presets', headers=auth_headers, json={
            'name': 'Invalid',
            'hours': 25,
            'minutes': 0,
            'seconds': 0
        })
        assert response.status_code == 400

        # Invalid minutes
        response = client.post('/api/presets', headers=auth_headers, json={
            'name': 'Invalid',
            'hours': 0,
            'minutes': 65,
            'seconds': 0
        })
        assert response.status_code == 400

    def test_update_preset(self, client, auth_headers):
        """Should update a preset"""
        # Create preset
        response = client.post('/api/presets', headers=auth_headers, json={
            'name': 'Original',
            'hours': 0,
            'minutes': 10,
            'seconds': 0
        })
        preset_id = response.get_json()['preset_id']

        # Update it
        response = client.put(f'/api/presets/{preset_id}',
                             headers=auth_headers,
                             json={
                                 'name': 'Updated',
                                 'hours': 0,
                                 'minutes': 15,
                                 'seconds': 30
                             })

        assert response.status_code == 200

        # Verify update
        response = client.get('/api/presets', headers=auth_headers)
        data = response.get_json()
        preset = data['presets'][0]
        assert preset['name'] == 'Updated'
        assert preset['minutes'] == 15
        assert preset['seconds'] == 30

    def test_delete_preset(self, client, auth_headers):
        """Should delete a preset"""
        # Create preset
        response = client.post('/api/presets', headers=auth_headers, json={
            'name': 'To Delete',
            'hours': 0,
            'minutes': 5,
            'seconds': 0
        })
        preset_id = response.get_json()['preset_id']

        # Delete it
        response = client.delete(f'/api/presets/{preset_id}',
                                headers=auth_headers)

        assert response.status_code == 200

        # Verify deletion
        response = client.get('/api/presets', headers=auth_headers)
        data = response.get_json()
        assert len(data['presets']) == 0

    def test_presets_require_auth(self, client):
        """Should require authentication for presets"""
        response = client.get('/api/presets')
        assert response.status_code == 401


def run_tests():
    """Run all tests and print results"""
    print('\n' + '='*70)
    print('🧪 RUNNING BACKEND API TESTS')
    print('='*70 + '\n')

    # Run pytest
    pytest_args = [
        __file__,
        '-v',
        '--tb=short',
        '--color=yes'
    ]

    exit_code = pytest.main(pytest_args)

    print('\n' + '='*70)
    if exit_code == 0:
        print('✅ ALL BACKEND TESTS PASSED')
    else:
        print('❌ SOME BACKEND TESTS FAILED')
    print('='*70 + '\n')

    return exit_code


if __name__ == '__main__':
    exit_code = run_tests()
    sys.exit(exit_code)

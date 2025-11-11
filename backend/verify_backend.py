#!/usr/bin/env python3
"""
Simple verification script for backend functionality
Tests core models and basic operations without Flask test client
"""
import os
import sys

# Clean test database if exists
test_db = 'test_verify.db'
if os.path.exists(test_db):
    os.remove(test_db)

from models import Database, User, UserPreferences, UserPresets

print('\n' + '='*70)
print('🔍 VERIFYING BACKEND MODELS AND DATABASE')
print('='*70 + '\n')

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = 0

def test(description):
    """Test decorator"""
    global total_tests
    total_tests += 1
    print(f'Test {total_tests}: {description}... ', end='')

def success():
    """Mark test as passed"""
    global passed_tests
    passed_tests += 1
    print('✓ PASS')

def failure(error):
    """Mark test as failed"""
    global failed_tests
    failed_tests += 1
    print(f'✗ FAIL - {error}')

# Initialize database
db = Database(test_db)
user_model = User(db)
prefs_model = UserPreferences(db)
presets_model = UserPresets(db)

# Test 1: Database initialization
test('Initialize database tables')
try:
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()

    required_tables = ['users', 'user_preferences', 'user_presets']
    if all(table in tables for table in required_tables):
        success()
    else:
        failure(f'Missing tables. Found: {tables}')
except Exception as e:
    failure(str(e))

# Test 2: Create user
test('Create new user')
try:
    user_id = user_model.create_user('testuser', 'test@example.com', 'password123')
    if user_id and user_id > 0:
        success()
    else:
        failure('User ID not returned')
except Exception as e:
    failure(str(e))

# Test 3: Get user by username
test('Get user by username')
try:
    user = user_model.get_user_by_username('testuser')
    if user and user['username'] == 'testuser':
        success()
    else:
        failure('User not found or invalid data')
except Exception as e:
    failure(str(e))

# Test 4: Verify password
test('Verify user password')
try:
    user = user_model.verify_password('testuser', 'password123')
    if user and user['username'] == 'testuser':
        success()
    else:
        failure('Password verification failed')
except Exception as e:
    failure(str(e))

# Test 5: Reject invalid password
test('Reject invalid password')
try:
    user = user_model.verify_password('testuser', 'wrongpassword')
    if user is None:
        success()
    else:
        failure('Invalid password was accepted')
except Exception as e:
    failure(str(e))

# Test 6: Prevent duplicate username
test('Prevent duplicate username')
try:
    user_id = user_model.create_user('testuser', 'another@example.com', 'pass')
    if user_id is None:
        success()
    else:
        failure('Duplicate username was allowed')
except Exception as e:
    failure(str(e))

# Test 7: Set user preference
test('Set user preference')
try:
    prefs_model.set_preference(1, 'voice_enabled', 'true')
    prefs = prefs_model.get_preferences(1)
    if prefs.get('voice_enabled') == 'true':
        success()
    else:
        failure('Preference not set correctly')
except Exception as e:
    failure(str(e))

# Test 8: Update existing preference
test('Update existing preference')
try:
    prefs_model.set_preference(1, 'voice_enabled', 'false')
    prefs = prefs_model.get_preferences(1)
    if prefs.get('voice_enabled') == 'false':
        success()
    else:
        failure('Preference not updated')
except Exception as e:
    failure(str(e))

# Test 9: Set multiple preferences
test('Set multiple preferences')
try:
    prefs_model.set_multiple_preferences(1, {
        'default_hours': '1',
        'default_minutes': '30',
        'custom_setting': 'test_value'
    })
    prefs = prefs_model.get_preferences(1)
    if (prefs.get('default_hours') == '1' and
        prefs.get('default_minutes') == '30' and
        prefs.get('custom_setting') == 'test_value'):
        success()
    else:
        failure('Not all preferences set')
except Exception as e:
    failure(str(e))

# Test 10: Delete preference
test('Delete preference')
try:
    prefs_model.delete_preference(1, 'custom_setting')
    prefs = prefs_model.get_preferences(1)
    if 'custom_setting' not in prefs:
        success()
    else:
        failure('Preference not deleted')
except Exception as e:
    failure(str(e))

# Test 11: Create timer preset
test('Create timer preset')
try:
    preset_id = presets_model.create_preset(1, 'Quick Break', 0, 5, 0)
    if preset_id and preset_id > 0:
        success()
    else:
        failure('Preset not created')
except Exception as e:
    failure(str(e))

# Test 12: Get user presets
test('Get user presets')
try:
    presets = presets_model.get_presets(1)
    if len(presets) == 1 and presets[0]['name'] == 'Quick Break':
        success()
    else:
        failure(f'Expected 1 preset, got {len(presets)}')
except Exception as e:
    failure(str(e))

# Test 13: Update preset
test('Update preset')
try:
    presets_model.update_preset(1, 1, 'Long Break', 0, 15, 30)
    presets = presets_model.get_presets(1)
    preset = presets[0]
    if (preset['name'] == 'Long Break' and
        preset['minutes'] == 15 and
        preset['seconds'] == 30):
        success()
    else:
        failure('Preset not updated correctly')
except Exception as e:
    failure(str(e))

# Test 14: Create multiple presets
test('Create multiple presets')
try:
    presets_model.create_preset(1, 'Short Timer', 0, 1, 0)
    presets_model.create_preset(1, 'Pomodoro', 0, 25, 0)
    presets = presets_model.get_presets(1)
    if len(presets) == 3:
        success()
    else:
        failure(f'Expected 3 presets, got {len(presets)}')
except Exception as e:
    failure(str(e))

# Test 15: Delete preset
test('Delete preset')
try:
    presets_model.delete_preset(1, 1)
    presets = presets_model.get_presets(1)
    if len(presets) == 2:
        success()
    else:
        failure(f'Expected 2 presets after deletion, got {len(presets)}')
except Exception as e:
    failure(str(e))

# Cleanup
if os.path.exists(test_db):
    os.remove(test_db)

# Print results
print('\n' + '='*70)
print('📊 TEST RESULTS')
print('='*70)
print(f'Total Tests:  {total_tests}')
print(f'✓ Passed:     {passed_tests}')
print(f'✗ Failed:     {failed_tests}')
print(f'Pass Rate:    {(passed_tests/total_tests*100):.1f}%')
print('='*70)

if failed_tests == 0:
    print('\n✅ ALL DATABASE TESTS PASSED!\n')
    sys.exit(0)
else:
    print(f'\n❌ {failed_tests} TEST(S) FAILED\n')
    sys.exit(1)

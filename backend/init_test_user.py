#!/usr/bin/env python3
"""
Initialize Test User Script
Creates a test user in Supabase Auth for development/testing purposes
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()


def init_test_user():
    """Initialize test user in Supabase Auth"""

    # Get configuration
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

    # Test user credentials
    test_email = os.getenv('TEST_USER_EMAIL', 'testuser@example.com')
    test_password = os.getenv('TEST_USER_PASSWORD', 'TestPassword123!')
    test_username = os.getenv('TEST_USER_USERNAME', 'testuser')

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
        return False

    try:
        # Initialize Supabase client with service role key
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✓ Connected to Supabase")

        # Create test user using admin API
        try:
            result = supabase.auth.admin.create_user({
                'email': test_email,
                'password': test_password,
                'email_confirm': True,  # Auto-confirm email for testing
                'user_metadata': {
                    'username': test_username,
                    'display_name': test_username
                }
            })

            if result.user:
                print("✓ Test user created successfully!")
                print(f"\n📋 Test User Credentials:")
                print(f"   Email: {test_email}")
                print(f"   Password: {test_password}")
                print(f"   Username: {test_username}")
                print(f"\n⚠️  NOTE: This user is for testing purposes only!")
                return True
            else:
                print("❌ Failed to create test user")
                return False

        except Exception as e:
            error_msg = str(e)
            if 'already been registered' in error_msg or 'already exists' in error_msg:
                print(f"ℹ️  Test user already exists: {test_email}")
                print(f"\n📋 Test User Credentials:")
                print(f"   Email: {test_email}")
                print(f"   Password: {test_password}")
                print(f"   Username: {test_username}")
                return True
            else:
                raise e

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == '__main__':
    print("=" * 60)
    print("Test User Initialization Script")
    print("=" * 60)
    print()

    success = init_test_user()

    print()
    if success:
        print("✓ Setup complete! You can now login with the test user.")
        print("  URL: http://localhost:5000/")
    else:
        print("❌ Setup failed. Please check the error messages above.")
    print("=" * 60)

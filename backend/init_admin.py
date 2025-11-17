#!/usr/bin/env python3
"""
Initialize Admin User Script
Creates the first admin user in Supabase database
"""

import os
import hashlib
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def init_admin_user():
    """Initialize admin user in Supabase"""

    # Get configuration
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    admin_password = os.getenv('ADMIN_PASSWORD', 'Admin123!')

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
        return False

    try:
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✓ Connected to Supabase")

        # Check if admin already exists
        response = supabase.table('admin_users').select('*').eq('email', admin_email).execute()

        if response.data:
            print(f"ℹ️  Admin user already exists: {admin_email}")

            # Ask if user wants to update password
            update = input("Do you want to update the password? (y/n): ")
            if update.lower() == 'y':
                new_password = input("Enter new password: ")
                if len(new_password) < 6:
                    print("❌ Password must be at least 6 characters")
                    return False

                password_hash = hash_password(new_password)
                supabase.table('admin_users').update({
                    'password_hash': password_hash
                }).eq('email', admin_email).execute()

                print(f"✓ Password updated for {admin_email}")
                return True
            else:
                print("No changes made.")
                return True

        # Create new admin user
        password_hash = hash_password(admin_password)

        result = supabase.table('admin_users').insert({
            'email': admin_email,
            'password_hash': password_hash,
            'full_name': 'System Administrator',
            'is_active': True
        }).execute()

        if result.data:
            print("✓ Admin user created successfully!")
            print(f"\n📋 Admin Credentials:")
            print(f"   Email: {admin_email}")
            print(f"   Password: {admin_password}")
            print(f"\n⚠️  IMPORTANT: Change these credentials in production!")
            return True
        else:
            print("❌ Failed to create admin user")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == '__main__':
    print("=" * 60)
    print("Admin User Initialization Script")
    print("=" * 60)
    print()

    success = init_admin_user()

    print()
    if success:
        print("✓ Setup complete! You can now login to the admin panel.")
        print("  URL: http://localhost:5000/admin.html")
    else:
        print("❌ Setup failed. Please check the error messages above.")
    print("=" * 60)

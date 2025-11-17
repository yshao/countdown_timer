"""
Database models for Countdown Timer API
"""
import sqlite3
import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, List


class Database:
    """Database manager for SQLite operations"""

    def __init__(self, db_path='timer_app.db'):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')

        # User preferences table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                preference_key TEXT NOT NULL,
                preference_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, preference_key)
            )
        ''')

        # User presets table (custom timer presets)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_presets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                hours INTEGER NOT NULL,
                minutes INTEGER NOT NULL,
                seconds INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        conn.commit()
        conn.close()

    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            conn.commit()
            results = cursor.fetchall()
            return results
        finally:
            conn.close()

    def execute_insert(self, query, params):
        """Execute an insert query and return the inserted ID"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            last_id = cursor.lastrowid
            return last_id
        finally:
            conn.close()


class User:
    """User model"""

    def __init__(self, db: Database):
        self.db = db

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()

    def create_user(self, username: str, email: str, password: str) -> Optional[int]:
        """Create a new user"""
        try:
            password_hash = self.hash_password(password)
            query = '''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            '''
            user_id = self.db.execute_insert(query, (username, email, password_hash))
            return user_id
        except sqlite3.IntegrityError:
            return None

    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        query = 'SELECT * FROM users WHERE username = ?'
        results = self.db.execute_query(query, (username,))

        if results:
            row = results[0]
            return dict(row)
        return None

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        query = 'SELECT * FROM users WHERE id = ?'
        results = self.db.execute_query(query, (user_id,))

        if results:
            row = results[0]
            return dict(row)
        return None

    def verify_password(self, username: str, password: str) -> Optional[Dict]:
        """Verify user password and return user data if valid"""
        user = self.get_user_by_username(username)

        if user and user['password_hash'] == self.hash_password(password):
            # Update last login
            self.update_last_login(user['id'])
            return user
        return None

    def update_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
        self.db.execute_query(query, (user_id,))


class UserPreferences:
    """User preferences model"""

    def __init__(self, db: Database):
        self.db = db

    def get_preferences(self, user_id: int) -> Dict[str, str]:
        """Get all preferences for a user"""
        query = 'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = ?'
        results = self.db.execute_query(query, (user_id,))

        preferences = {}
        for row in results:
            preferences[row['preference_key']] = row['preference_value']

        return preferences

    def set_preference(self, user_id: int, key: str, value: str):
        """Set a preference for a user"""
        query = '''
            INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, preference_key)
            DO UPDATE SET preference_value = ?, updated_at = CURRENT_TIMESTAMP
        '''
        self.db.execute_query(query, (user_id, key, value, value))

    def delete_preference(self, user_id: int, key: str):
        """Delete a preference"""
        query = 'DELETE FROM user_preferences WHERE user_id = ? AND preference_key = ?'
        self.db.execute_query(query, (user_id, key))

    def set_multiple_preferences(self, user_id: int, preferences: Dict[str, str]):
        """Set multiple preferences at once"""
        for key, value in preferences.items():
            self.set_preference(user_id, key, value)


class UserPresets:
    """User timer presets model"""

    def __init__(self, db: Database):
        self.db = db

    def create_preset(self, user_id: int, name: str, hours: int, minutes: int, seconds: int) -> int:
        """Create a new timer preset"""
        query = '''
            INSERT INTO user_presets (user_id, name, hours, minutes, seconds)
            VALUES (?, ?, ?, ?, ?)
        '''
        preset_id = self.db.execute_insert(query, (user_id, name, hours, minutes, seconds))
        return preset_id

    def get_presets(self, user_id: int) -> List[Dict]:
        """Get all presets for a user"""
        query = '''
            SELECT id, name, hours, minutes, seconds, created_at
            FROM user_presets WHERE user_id = ?
            ORDER BY created_at DESC
        '''
        results = self.db.execute_query(query, (user_id,))

        presets = []
        for row in results:
            presets.append(dict(row))

        return presets

    def delete_preset(self, user_id: int, preset_id: int):
        """Delete a preset"""
        query = 'DELETE FROM user_presets WHERE id = ? AND user_id = ?'
        self.db.execute_query(query, (preset_id, user_id))

    def update_preset(self, user_id: int, preset_id: int, name: str, hours: int, minutes: int, seconds: int):
        """Update a preset"""
        query = '''
            UPDATE user_presets
            SET name = ?, hours = ?, minutes = ?, seconds = ?
            WHERE id = ? AND user_id = ?
        '''
        self.db.execute_query(query, (name, hours, minutes, seconds, preset_id, user_id))

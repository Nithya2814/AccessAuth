# database.py - SQLite Database Management & Cryptography
import sqlite3
import os
import hashlib
import json

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            face_data TEXT NOT NULL,
            failed_attempts INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def hash_password(password: str, salt: str = None) -> tuple:
    """Secure password hashing using PBKDF2-HMAC-SHA256 with cryptographic salt."""
    if salt is None:
        salt = os.urandom(16).hex()
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    key = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000)
    return key.hex(), salt

def verify_password(password: str, salt: str, stored_hash: str) -> bool:
    computed_hash, _ = hash_password(password, salt)
    return computed_hash == stored_hash

def register_user(fullname: str, email: str, phone: str, password: str, face_data: str) -> tuple:
    """Registers a new user with hashed password and face biometric template."""
    conn = get_connection()
    cursor = conn.cursor()
    pwd_hash, salt = hash_password(password)
    try:
        cursor.execute("""
            INSERT INTO users (fullname, email, phone, password_hash, salt, face_data, failed_attempts)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        """, (fullname.strip(), email.strip().lower(), phone.strip(), pwd_hash, salt, face_data))
        conn.commit()
        return True, "Success"
    except sqlite3.IntegrityError:
        return False, "An account with this email already exists."
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    user = cursor.fetchone()
    conn.close()
    return user

def increment_failed_attempts(email: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET failed_attempts = failed_attempts + 1 
        WHERE email = ?
    """, (email.strip().lower(),))
    conn.commit()
    
    cursor.execute("SELECT failed_attempts FROM users WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return row["failed_attempts"] if row else 1

def reset_failed_attempts(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET failed_attempts = 0 
        WHERE email = ?
    """, (email.strip().lower(),))
    conn.commit()
    conn.close()

def get_all_users_with_face():
    """Retrieves all registered users who have enrolled face biometric templates."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, fullname, email, phone, face_data FROM users WHERE face_data IS NOT NULL AND face_data != ''")
    rows = cursor.fetchall()
    conn.close()
    return rows
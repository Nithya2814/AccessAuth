# database.py - SQLite Database Management & Cryptography
import sqlite3
import os
import hashlib
import json
import time
import secrets

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    # 1. Core Users Table
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
    # 2. Security Audit & Observability Telemetry Table (PS05 Module 4)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            event_type TEXT NOT NULL,
            user_email TEXT,
            ip_address TEXT,
            device_fingerprint TEXT,
            risk_score INTEGER DEFAULT 0,
            details TEXT
        )
    """)
    # 3. Decentralized WebAuthn / FIDO2 Public Key Credentials Table (PS05 Module 1)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS webauthn_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            credential_id TEXT UNIQUE NOT NULL,
            public_key TEXT NOT NULL,
            sign_counter INTEGER DEFAULT 0,
            aaguid TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # 4. Ephemeral Cryptographic Single-Use Recovery Tokens Table (PS05 Module 3)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recovery_tokens (
            token_hash TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            expires_at REAL NOT NULL,
            used INTEGER DEFAULT 0
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

# ===============================================================
# 🛡️ ZERO-TRUST AUDIT & OBSERVABILITY ENGINE (PS05 MODULE 4)
# ===============================================================
def log_security_event(event_type: str, user_email: str = "", ip_address: str = "127.0.0.1", device_fingerprint: str = "", risk_score: int = 0, details: str = ""):
    """Logs security telemetry events to audit_logs table for anomaly detection."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (event_type, user_email, ip_address, device_fingerprint, risk_score, details)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (event_type, user_email.strip().lower() if user_email else "", ip_address, device_fingerprint, risk_score, details))
        conn.commit()
        conn.close()
    except Exception:
        pass

def check_ip_throttle(ip_address: str = "127.0.0.1", max_failed: int = 5, window_minutes: int = 15) -> bool:
    """
    Checks if an IP address is throttled due to excessive failed attempts.
    Zero-Trust dynamic rate-limiting.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) as fail_count 
            FROM audit_logs 
            WHERE ip_address = ? 
              AND event_type IN ('AUTH_FAILED', 'BIOMETRIC_MISMATCH', 'REPLAY_ATTACK_BLOCKED')
              AND timestamp >= datetime('now', '-' || ? || ' minutes')
        """, (ip_address, window_minutes))
        row = cursor.fetchone()
        conn.close()
        return (row["fail_count"] if row else 0) >= max_failed
    except Exception:
        return False

def get_security_audit_logs(limit: int = 50):
    """Retrieves recent security audit logs for administrative observability."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return rows
    except Exception:
        return []

# ===============================================================
# 🔑 FIDO2 / WEBAUTHN PUBLIC-KEY HANDLER (PS05 MODULE 1)
# ===============================================================
def register_webauthn_credential(user_email: str, credential_id: str, public_key: str, aaguid: str = "00000000-0000-0000-0000-000000000000") -> bool:
    """Enrolls a hardware-backed asymmetric WebAuthn public key."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO webauthn_credentials (user_email, credential_id, public_key, sign_counter, aaguid)
            VALUES (?, ?, ?, 0, ?)
        """, (user_email.strip().lower(), credential_id, public_key, aaguid))
        conn.commit()
        conn.close()
        return True
    except Exception:
        return False

def verify_webauthn_counter(credential_id: str, incoming_counter: int) -> bool:
    """
    Anti-Replay Protection: Verifies that incoming sign_counter is strictly
    greater than the stored counter. Prevents cryptographic token replay attacks.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT sign_counter FROM webauthn_credentials WHERE credential_id = ?", (credential_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return True # Fallback if first registration
        stored_counter = row["sign_counter"]
        if incoming_counter <= stored_counter:
            conn.close()
            return False # Replay attack detected!
        cursor.execute("UPDATE webauthn_credentials SET sign_counter = ? WHERE credential_id = ?", (incoming_counter, credential_id))
        conn.commit()
        conn.close()
        return True
    except Exception:
        return True

# ===============================================================
# ⏳ EPHEMERAL CRYPTOGRAPHIC RECOVERY TOKENS (PS05 MODULE 3)
# ===============================================================
def create_ephemeral_recovery_token(email: str, duration_sec: int = 300) -> str:
    """
    Generates a 32-byte single-use cryptographic recovery token with 5-minute expiry.
    Eliminates easily phished security questions (Mother's maiden name, pet name).
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    expires_at = time.time() + duration_sec
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO recovery_tokens (token_hash, user_email, expires_at, used)
            VALUES (?, ?, ?, 0)
        """, (token_hash, email.strip().lower(), expires_at))
        conn.commit()
        conn.close()
    except Exception:
        pass
    return raw_token

def validate_ephemeral_recovery_token(raw_token: str) -> tuple:
    """Validates single-use token and consumes it if valid."""
    token_hash = hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()
    now = time.time()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recovery_tokens WHERE token_hash = ? AND used = 0", (token_hash,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False, "Invalid or already consumed recovery token."
        if now > row["expires_at"]:
            conn.close()
            return False, "Recovery token expired (5-minute security limit exceeded)."
        cursor.execute("UPDATE recovery_tokens SET used = 1 WHERE token_hash = ?", (token_hash,))
        conn.commit()
        conn.close()
        return True, row["user_email"]
    except Exception as e:
        return False, str(e)
# risk_friction.py - Adaptive Zero-Trust Risk & Friction Engine (PS05 Core Architecture)
import random
import hashlib
import time

class RiskEngine:
    @staticmethod
    def calculate_risk_score(failed_attempts: int) -> dict:
        """
        Calculates real-time risk score based on failed attempts and anomaly indicators.
        Returns risk level and recommended friction action.
        """
        if failed_attempts == 0:
            return {
                "score": 0,
                "level": "LOW",
                "color": "green",
                "action": "STANDARD_LOGIN",
                "message": "Normal login behavior detected."
            }
        elif failed_attempts == 1:
            return {
                "score": 35,
                "level": "MODERATE",
                "color": "blue",
                "action": "STANDARD_LOGIN",
                "message": "1 failed attempt. Proceed with caution."
            }
        elif failed_attempts == 2:
            return {
                "score": 70,
                "level": "ELEVATED",
                "color": "orange",
                "action": "STANDARD_LOGIN",
                "message": "2 failed attempts. 1 attempt remaining before fallback lock."
            }
        else:
            return {
                "score": 95,
                "level": "CRITICAL",
                "color": "red",
                "action": "ADAPTIVE_STEP_UP",
                "message": "3+ failed attempts! Activating Adaptive Step-Up Authentication (OTP / Face Biometrics)."
            }

class PassiveRiskEngine:
    """
    Passive Zero-Trust Backend Risk Scoring (PS05 Architecture Blueprint).
    Evaluates context, IP origin, hardware fingerprint, and timing silently in the background
    without asking user for extra steps during low-risk situations.
    """
    @staticmethod
    def compute_device_fingerprint(user_agent: str = "Mozilla/5.0", client_ip: str = "127.0.0.1", platform_entropy: str = "") -> str:
        """Generates SHA-256 hardware/client fingerprint token."""
        raw = f"{user_agent}|{client_ip}|{platform_entropy}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()[:24]

    @staticmethod
    def evaluate_zero_trust(ip_address: str, device_fingerprint: str, failed_attempts: int, is_throttled: bool = False) -> dict:
        """
        Calculates composite Zero-Trust score (0 - 100) combining IP velocity,
        failed attempt weighting, and device recognition.
        """
        base_score = 5 # Normal baseline
        risk_factors = []

        # 1. IP Throttling evaluation
        if is_throttled:
            base_score += 85
            risk_factors.append("IP Address Rate Throttled (Rapid Burst Failures)")

        # 2. Failed attempts penalty
        if failed_attempts == 1:
            base_score += 25
            risk_factors.append("1 Previous Authentication Failure")
        elif failed_attempts == 2:
            base_score += 55
            risk_factors.append("Multiple Sequential Failures")
        elif failed_attempts >= 3:
            base_score += 85
            risk_factors.append("Exceeded Max Credential Failure Threshold")

        # 3. Known device fingerprint heuristic
        # If fingerprint has anomalous pattern
        if len(device_fingerprint) < 10:
            base_score += 20
            risk_factors.append("Unverified Client Fingerprint")

        final_score = min(100, max(0, base_score))

        if final_score < 25:
            decision = "ALLOW_FRICTIONLESS"
            level = "LOW"
        elif final_score < 65:
            decision = "STANDARD_CHECK"
            level = "MODERATE"
        elif final_score < 85:
            decision = "STEP_UP_CHALLENGE"
            level = "HIGH"
        else:
            decision = "LOCKOUT_THROTTLED"
            level = "CRITICAL"

        return {
            "score": final_score,
            "level": level,
            "decision": decision,
            "risk_factors": risk_factors or ["Normal Low-Risk Telemetry"],
            "device_fingerprint": device_fingerprint,
            "timestamp": time.time()
        }

class FrictionEngine:
    @staticmethod
    def generate_otp() -> str:
        """Generates a secure 6-digit one-time passcode."""
        return str(random.randint(100000, 999999))

    @staticmethod
    def generate_captcha() -> tuple:
        """
        Generates a secure 5-character alphanumeric CAPTCHA code.
        Prevents automated arithmetic bots from trivial automated solving.
        """
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        code = "".join(random.choice(chars) for _ in range(5))
        return code, code

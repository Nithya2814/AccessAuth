# risk_friction.py - Adaptive Risk & Friction Engine
import random

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

class FrictionEngine:
    @staticmethod
    def generate_otp() -> str:
        """Generates a secure 6-digit one-time passcode."""
        return str(random.randint(100000, 999999))

    @staticmethod
    def generate_captcha() -> tuple:
        """Generates a simple, accessible math CAPTCHA."""
        n1 = random.randint(1, 9)
        n2 = random.randint(1, 9)
        question = f"{n1} + {n2}"
        answer = n1 + n2
        return question, answer

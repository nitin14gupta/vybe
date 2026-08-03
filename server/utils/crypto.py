import hashlib
import hmac
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_KEY = os.getenv("PAYOUT_ENCRYPTION_KEY")
_fernet = Fernet(_KEY.encode()) if _KEY else None


def encrypt(plaintext: str) -> str:
    if not _fernet:
        raise RuntimeError("PAYOUT_ENCRYPTION_KEY is not configured")
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    if not _fernet:
        raise RuntimeError("PAYOUT_ENCRYPTION_KEY is not configured")
    return _fernet.decrypt(ciphertext.encode()).decode()


def fingerprint(value: str) -> str:
    """Deterministic HMAC-SHA256 of a payout identifier (account number+IFSC, or UPI ID).

    Used only to detect duplicates across users via a unique index — the raw
    value stays encrypted separately and is never recoverable from this hash.
    """
    if not _KEY:
        raise RuntimeError("PAYOUT_ENCRYPTION_KEY is not configured")
    return hmac.new(_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()

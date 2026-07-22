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

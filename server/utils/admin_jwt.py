import os
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt
from dotenv import load_dotenv

from utils.jwt import SECRET_KEY, ALGORITHM  # same signing key/algorithm, distinct token "type" claim

load_dotenv()

# Shorter-lived than the mobile app's 100-day refresh token — this is a
# privileged admin session, not a consumer app that should stay signed in
# indefinitely.
ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES = 15
ADMIN_REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_admin_access_token(admin_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": admin_id, "exp": expire, "type": "admin_access"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_admin_refresh_token(admin_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ADMIN_REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": admin_id, "exp": expire, "type": "admin_refresh", "jti": secrets.token_hex(16)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def admin_refresh_token_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=ADMIN_REFRESH_TOKEN_EXPIRE_DAYS)

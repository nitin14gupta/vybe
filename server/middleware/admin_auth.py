from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt import decode_token
from db.config import get_db

admin_bearer_scheme = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(admin_bearer_scheme),
) -> dict:
    """Sibling of middleware/auth.py::get_current_user for the admin panel.

    Deliberately separate — a mobile user's "access" token and an admin's
    "admin_access" token are never interchangeable, even though both are
    signed with the same JWT_SECRET_KEY.
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "admin_access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_id = payload.get("sub")
    if not admin_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    with get_db() as (cur, _):
        cur.execute(
            "SELECT id, email, name, role, is_active FROM admin_users WHERE id = %s",
            (admin_id,),
        )
        admin = cur.fetchone()

    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")

    if not admin["is_active"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated")

    return dict(admin)

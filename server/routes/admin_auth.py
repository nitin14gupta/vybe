from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr

from utils.admin_jwt import (
    create_admin_access_token, create_admin_refresh_token,
    admin_refresh_token_expires_at,
)
from utils.jwt import decode_token, hash_token
from utils.password import verify_password
from middleware.admin_auth import get_current_admin
from db.config import get_db

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


class AdminLoginBody(BaseModel):
    email: EmailStr
    password: str


class AdminRefreshBody(BaseModel):
    refresh_token: str


class AdminTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    admin_id: str
    name: str | None
    email: str
    role: str


# ── POST /admin/auth/login ────────────────────────────────────────────────────

@router.post("/login", response_model=AdminTokenResponse)
def admin_login(body: AdminLoginBody):
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id, email, name, role, password_hash, is_active FROM admin_users WHERE email = %s",
            (body.email.lower(),),
        )
        admin = cur.fetchone()

    if not admin or not verify_password(body.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not admin["is_active"]:
        raise HTTPException(status_code=403, detail="Admin account is deactivated")

    admin_id = str(admin["id"])
    access_token = create_admin_access_token(admin_id)
    refresh_token = create_admin_refresh_token(admin_id)

    with get_db() as (cur, conn):
        cur.execute("DELETE FROM admin_refresh_tokens WHERE admin_id = %s", (admin_id,))
        cur.execute(
            "INSERT INTO admin_refresh_tokens (admin_id, token_hash, expires_at) VALUES (%s, %s, %s)",
            (admin_id, hash_token(refresh_token), admin_refresh_token_expires_at()),
        )
        cur.execute("UPDATE admin_users SET last_login_at = NOW() WHERE id = %s", (admin_id,))
        conn.commit()

    return AdminTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        admin_id=admin_id,
        name=admin["name"],
        email=admin["email"],
        role=admin["role"],
    )


# ── POST /admin/auth/refresh ──────────────────────────────────────────────────

@router.post("/refresh", response_model=AdminTokenResponse)
def admin_refresh(body: AdminRefreshBody):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "admin_refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_hash = hash_token(body.refresh_token)
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id FROM admin_refresh_tokens WHERE token_hash = %s AND expires_at > NOW()",
            (token_hash,),
        )
        stored = cur.fetchone()

    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    admin_id = payload["sub"]
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id, email, name, role, is_active FROM admin_users WHERE id = %s",
            (admin_id,),
        )
        admin = cur.fetchone()

    if not admin or not admin["is_active"]:
        raise HTTPException(status_code=401, detail="Admin not found or deactivated")

    new_access = create_admin_access_token(admin_id)
    new_refresh = create_admin_refresh_token(admin_id)

    with get_db() as (cur, conn):
        cur.execute("DELETE FROM admin_refresh_tokens WHERE token_hash = %s", (token_hash,))
        cur.execute(
            "INSERT INTO admin_refresh_tokens (admin_id, token_hash, expires_at) VALUES (%s, %s, %s)",
            (admin_id, hash_token(new_refresh), admin_refresh_token_expires_at()),
        )
        conn.commit()

    return AdminTokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        admin_id=admin_id,
        name=admin["name"],
        email=admin["email"],
        role=admin["role"],
    )


# ── POST /admin/auth/logout ───────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def admin_logout(body: AdminRefreshBody, _: dict = Depends(get_current_admin)):
    token_hash = hash_token(body.refresh_token)
    with get_db() as (cur, conn):
        cur.execute("DELETE FROM admin_refresh_tokens WHERE token_hash = %s", (token_hash,))
        conn.commit()


# ── GET /admin/auth/me ────────────────────────────────────────────────────────

@router.get("/me")
def admin_me(current_admin: dict = Depends(get_current_admin)):
    return {
        "admin_id": str(current_admin["id"]),
        "email": current_admin["email"],
        "name": current_admin["name"],
        "role": current_admin["role"],
    }

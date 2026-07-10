from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from schemas.auth import PhoneSendRequest, OTPVerifyRequest, TokenResponse, RefreshRequest
from utils.twilio_client import send_otp, verify_otp
from utils.jwt import (
    create_access_token, create_refresh_token,
    decode_token, hash_token, refresh_token_expires_at,
)
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp_route(body: PhoneSendRequest):
    full_phone = f"{body.country_code}{body.phone}"
    try:
        ok = send_otp(full_phone)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"SMS service unavailable: {str(e)}")
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_route(body: OTPVerifyRequest):
    full_phone = f"{body.country_code}{body.phone}"

    try:
        approved = verify_otp(full_phone, body.code)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Verification service unavailable: {str(e)}")

    if not approved:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    with get_db() as (cur, conn):
        # Check if phone belongs to a soft-deleted account first
        cur.execute(
            "SELECT is_deleted, deleted_at FROM users WHERE phone = %s",
            (body.phone,),
        )
        existing = cur.fetchone()
        if existing and existing["is_deleted"]:
            deleted_at = existing["deleted_at"]
            deleted_str = deleted_at.strftime("%d %b %Y") if deleted_at else "recently"
            raise HTTPException(
                status_code=410,
                detail=f"ACCOUNT_DELETED:{deleted_str}",
            )

        cur.execute(
            """
            INSERT INTO users (phone, country_code)
            VALUES (%s, %s)
            ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
            RETURNING id, profile_complete
            """,
            (body.phone, body.country_code),
        )
        user = cur.fetchone()

    user_id = str(user["id"])
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    with get_db() as (cur, _):
        # Enforce single session: log out of all other devices by clearing old refresh tokens
        cur.execute("DELETE FROM refresh_tokens WHERE user_id = %s", (user_id,))
        # Also clear any old push tokens associated with this user
        cur.execute("DELETE FROM device_tokens WHERE user_id = %s", (user_id,))

        cur.execute(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
            (user_id, hash_token(refresh_token), refresh_token_expires_at()),
        )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_id,
        profile_complete=user["profile_complete"],
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_route(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_hash = hash_token(body.refresh_token)
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id FROM refresh_tokens WHERE token_hash = %s AND expires_at > NOW()",
            (token_hash,),
        )
        stored = cur.fetchone()

    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    user_id = payload["sub"]
    with get_db() as (cur, _):
        cur.execute("SELECT id, profile_complete FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    with get_db() as (cur, _):
        cur.execute("DELETE FROM refresh_tokens WHERE token_hash = %s", (token_hash,))
        cur.execute(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
            (user_id, hash_token(new_refresh), refresh_token_expires_at()),
        )

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user_id=user_id,
        profile_complete=user["profile_complete"],
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_route(body: RefreshRequest, _: dict = Depends(get_current_user)):
    token_hash = hash_token(body.refresh_token)
    with get_db() as (cur, _):
        cur.execute("DELETE FROM refresh_tokens WHERE token_hash = %s", (token_hash,))

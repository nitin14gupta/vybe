from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/devices", tags=["devices"])


class TokenPayload(BaseModel):
    expo_token: str
    platform: Optional[str] = None


@router.post("/token", status_code=200)
def register_token(payload: TokenPayload, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        # Dissociate token from any other user (device hand-off between accounts)
        cur.execute(
            "DELETE FROM device_tokens WHERE expo_token = %s",
            (payload.expo_token,),
        )
        # Enforce single device per user: UPSERT based on user_id
        cur.execute(
            """
            INSERT INTO device_tokens (user_id, expo_token, platform)
            VALUES (%s::uuid, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET 
                expo_token = EXCLUDED.expo_token,
                platform = EXCLUDED.platform
            """,
            (uid, payload.expo_token, payload.platform),
        )
        conn.commit()
    return {"ok": True}


@router.delete("/token", status_code=200)
def remove_token(payload: TokenPayload, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            "DELETE FROM device_tokens WHERE user_id = %s::uuid AND expo_token = %s",
            (uid, payload.expo_token),
        )
        conn.commit()
    return {"ok": True}

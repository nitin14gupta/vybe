from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/vibes", tags=["vibes"])

# Ensure vibe_requests table exists on startup
_DDL = """
CREATE TABLE IF NOT EXISTS public.vibe_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    passed_at TIMESTAMPTZ,
    CONSTRAINT vibe_requests_sender_receiver_key UNIQUE (sender_id, receiver_id),
    CONSTRAINT vibe_requests_no_self CHECK (sender_id <> receiver_id)
)
"""

def _ensure_table():
    with get_db() as (cur, conn):
        cur.execute(_DDL)
        conn.commit()


class SendVibeRequest(BaseModel):
    target_id: str
    message: Optional[str] = None


@router.post("", status_code=201)
def send_vibe(body: SendVibeRequest, current_user: dict = Depends(get_current_user)):
    _ensure_table()
    sender_id = current_user["id"]
    receiver_id = body.target_id

    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot vibe yourself")

    with get_db() as (cur, conn):
        # Upsert: if expired/passed, reset to pending
        cur.execute(
            """
            INSERT INTO vibe_requests (sender_id, receiver_id, message, status, created_at, expires_at, passed_at)
            VALUES (%s, %s, %s, 'pending', NOW(), NOW() + INTERVAL '7 days', NULL)
            ON CONFLICT (sender_id, receiver_id) DO UPDATE
                SET status = 'pending',
                    message = EXCLUDED.message,
                    created_at = NOW(),
                    expires_at = NOW() + INTERVAL '7 days',
                    passed_at = NULL
                WHERE vibe_requests.status IN ('expired', 'passed')
            """,
            (sender_id, receiver_id, body.message),
        )
        conn.commit()

    return {"ok": True}


@router.get("/received")
def get_received_vibes(current_user: dict = Depends(get_current_user)):
    _ensure_table()
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                vr.id::text,
                vr.sender_id::text,
                u.name,
                vr.message,
                vr.status,
                vr.created_at
            FROM vibe_requests vr
            JOIN users u ON u.id = vr.sender_id
            WHERE vr.receiver_id = %s
              AND vr.status = 'pending'
              AND vr.expires_at > NOW()
            ORDER BY vr.created_at DESC
            """,
            (current_user["id"],),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@router.get("/sent")
def get_sent_vibes(current_user: dict = Depends(get_current_user)):
    _ensure_table()
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                vr.id::text,
                vr.receiver_id::text,
                u.name,
                vr.message,
                vr.status,
                vr.created_at,
                vr.expires_at
            FROM vibe_requests vr
            JOIN users u ON u.id = vr.receiver_id
            WHERE vr.sender_id = %s
            ORDER BY vr.created_at DESC
            """,
            (current_user["id"],),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


class RespondVibeRequest(BaseModel):
    action: str  # "accept" | "pass"


@router.patch("/{vibe_id}")
def respond_to_vibe(
    vibe_id: str,
    body: RespondVibeRequest,
    current_user: dict = Depends(get_current_user),
):
    _ensure_table()
    if body.action not in ("accept", "pass"):
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'pass'")

    new_status = "accepted" if body.action == "accept" else "passed"
    passed_at_sql = "NOW()" if body.action == "pass" else "NULL"

    with get_db() as (cur, conn):
        cur.execute(
            f"""
            UPDATE vibe_requests
            SET status = %s, passed_at = {passed_at_sql}
            WHERE id = %s AND receiver_id = %s AND status = 'pending'
            """,
            (new_status, vibe_id, current_user["id"]),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Vibe request not found or already responded")
        conn.commit()

    return {"ok": True, "status": new_status}

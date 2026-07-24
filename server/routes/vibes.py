from datetime import datetime, timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db
from routes.notifications import notify_vybe_accepted, notify_vybe_request
from utils.push import send_push

router = APIRouter(prefix="/vibes", tags=["vibes"])


class SendVibeRequest(BaseModel):
    target_id: str
    message: str = Field(..., min_length=1, max_length=150)


class RespondVibeRequest(BaseModel):
    action: str  # "accept" | "pass"
    icebreaker: Optional[str] = Field(None, max_length=150)


@router.post("", status_code=201)
def send_vibe(body: SendVibeRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    sender_id = current_user["id"]
    receiver_id = body.target_id

    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot vibe yourself")

    with get_db() as (cur, conn):
        cur.execute("SELECT COALESCE(is_deleted, FALSE) AS is_deleted FROM users WHERE id = %s::uuid", (receiver_id,))
        target = cur.fetchone()
        if not target or target["is_deleted"]:
            raise HTTPException(status_code=404, detail="User not found")

        # Check active cooldown
        cur.execute(
            """
            SELECT cooldown_until FROM vibe_requests
            WHERE sender_id = %s::uuid AND receiver_id = %s::uuid
              AND cooldown_until > NOW()
            """,
            (sender_id, receiver_id),
        )
        if cur.fetchone():
            raise HTTPException(status_code=429, detail="Please wait before sending another vibe")

        # Upsert vibe_request
        cur.execute(
            """
            INSERT INTO vibe_requests (sender_id, receiver_id, message, status, created_at, expires_at, passed_at)
            VALUES (%s::uuid, %s::uuid, %s, 'pending', NOW(), NOW() + INTERVAL '7 days', NULL)
            ON CONFLICT (sender_id, receiver_id) DO UPDATE
                SET status = 'pending',
                    message = EXCLUDED.message,
                    created_at = NOW(),
                    expires_at = NOW() + INTERVAL '7 days',
                    passed_at = NULL
                WHERE vibe_requests.status IN ('expired', 'passed')
            RETURNING id
            """,
            (sender_id, receiver_id, body.message),
        )
        row = cur.fetchone()
        if not row:
            # Conflict did nothing (existing pending request)
            cur.execute(
                "SELECT id FROM vibe_requests WHERE sender_id = %s::uuid AND receiver_id = %s::uuid",
                (sender_id, receiver_id),
            )
            row = cur.fetchone()
        vibe_id = row["id"] if row else None

        # Create conversation with status=pending (upsert by user pair)
        u1, u2 = (sender_id, receiver_id) if sender_id < receiver_id else (receiver_id, sender_id)
        cur.execute(
            """
            INSERT INTO conversations (user1_id, user2_id, vybe_request_id, status)
            VALUES (%s::uuid, %s::uuid, %s::uuid, 'pending')
            ON CONFLICT (user1_id, user2_id) DO UPDATE
                SET status = 'pending', vybe_request_id = EXCLUDED.vybe_request_id
            RETURNING id
            """,
            (u1, u2, vibe_id),
        )
        conv_row = cur.fetchone()
        conv_id = conv_row["id"] if conv_row else None

        # Insert first message (sender's vybe message)
        if conv_id:
            cur.execute(
                """
                INSERT INTO messages (conversation_id, sender_id, content, content_type)
                VALUES (%s::uuid, %s::uuid, %s, 'text')
                """,
                (conv_id, sender_id, body.message),
            )
            cur.execute(
                "UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid",
                (conv_id,),
            )

        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (sender_id,))
        sender_row = cur.fetchone()
        sender_name = sender_row["name"] if sender_row else "Someone"
        cur.execute(
            "SELECT url FROM user_photos WHERE user_id = %s::uuid ORDER BY position LIMIT 1",
            (sender_id,),
        )
        photo_row = cur.fetchone()
        sender_avatar = photo_row["url"] if photo_row else None

        notify_vybe_request(cur, receiver_id, sender_id, sender_name)

        conn.commit()

    background_tasks.add_task(
        send_push, receiver_id, "New Vybe",
        f"{sender_name} sent you a vybe",
        {"type": "vybe"},
        sender_avatar, category="social",
    )
    return {"ok": True, "conversation_id": str(conv_id) if conv_id else None}


@router.get("/received")
def get_received_vibes(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                vr.id::text,
                vr.sender_id::text,
                u.name,
                u.city,
                vr.message,
                vr.status,
                vr.created_at,
                COALESCE(
                    json_agg(
                        json_build_object('id', p.id::text, 'url', p.url, 'position', p.position)
                        ORDER BY p.position
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS photos
            FROM vibe_requests vr
            JOIN users u ON u.id = vr.sender_id AND COALESCE(u.is_deleted, FALSE) = FALSE
            LEFT JOIN user_photos p ON p.user_id = u.id
            WHERE vr.receiver_id = %s::uuid
              AND vr.status = 'pending'
              AND vr.expires_at > NOW()
            GROUP BY vr.id, u.name, u.city
            ORDER BY vr.created_at DESC
            """,
            (current_user["id"],),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@router.get("/sent")
def get_sent_vibes(current_user: dict = Depends(get_current_user)):
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
                vr.expires_at,
                vr.cooldown_until
            FROM vibe_requests vr
            JOIN users u ON u.id = vr.receiver_id AND COALESCE(u.is_deleted, FALSE) = FALSE
            WHERE vr.sender_id = %s::uuid
            ORDER BY vr.created_at DESC
            """,
            (current_user["id"],),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@router.patch("/{vibe_id}")
def respond_to_vibe(
    vibe_id: str,
    body: RespondVibeRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    if body.action not in ("accept", "pass"):
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'pass'")

    if body.action == "accept" and not (body.icebreaker and body.icebreaker.strip()):
        raise HTTPException(status_code=400, detail="icebreaker message is required to accept")

    with get_db() as (cur, conn):
        # Fetch the vibe request — the sender must still be a live account,
        # otherwise a deleted user's stale pending request could get "accepted"
        # into a real conversation with someone who no longer exists.
        cur.execute(
            """
            SELECT vr.id, vr.sender_id, vr.receiver_id, vr.rejection_count
            FROM vibe_requests vr
            JOIN users u ON u.id = vr.sender_id AND COALESCE(u.is_deleted, FALSE) = FALSE
            WHERE vr.id = %s::uuid AND vr.receiver_id = %s::uuid AND vr.status = 'pending'
            """,
            (vibe_id, current_user["id"]),
        )
        vibe = cur.fetchone()
        if not vibe:
            raise HTTPException(status_code=404, detail="Vibe request not found or already responded")

        sender_id = str(vibe["sender_id"])
        receiver_id = str(vibe["receiver_id"])

        if body.action == "accept":
            cur.execute(
                "UPDATE vibe_requests SET status = 'accepted', passed_at = NULL WHERE id = %s::uuid",
                (vibe_id,),
            )

            # Activate the conversation
            u1, u2 = (sender_id, receiver_id) if sender_id < receiver_id else (receiver_id, sender_id)
            cur.execute(
                """
                UPDATE conversations SET status = 'active'
                WHERE user1_id = %s::uuid AND user2_id = %s::uuid
                RETURNING id
                """,
                (u1, u2),
            )
            conv_row = cur.fetchone()
            conv_id = conv_row["id"] if conv_row else None

            # Insert icebreaker as second message
            if conv_id:
                cur.execute(
                    """
                    INSERT INTO messages (conversation_id, sender_id, content, content_type)
                    VALUES (%s::uuid, %s::uuid, %s, 'text')
                    """,
                    (conv_id, receiver_id, body.icebreaker.strip()),
                )
                cur.execute(
                    "UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid",
                    (conv_id,),
                )

            # Notify the vybe sender that their request was accepted
            cur.execute("SELECT name FROM users WHERE id = %s::uuid", (receiver_id,))
            accepter = cur.fetchone()
            accepter_name = accepter["name"] if accepter else "Someone"
            if accepter:
                notify_vybe_accepted(cur, sender_id, receiver_id, accepter_name)
            cur.execute(
                "SELECT url FROM user_photos WHERE user_id = %s::uuid ORDER BY position LIMIT 1",
                (receiver_id,),
            )
            accepter_photo = cur.fetchone()
            accepter_avatar = accepter_photo["url"] if accepter_photo else None

            conn.commit()

            background_tasks.add_task(
                send_push, sender_id, "Vybe Accepted",
                f"{accepter_name} accepted your vybe",
                {"type": "conversation", "conv_id": str(conv_id) if conv_id else ""},
                accepter_avatar, category="social",
            )
            return {"ok": True, "status": "accepted", "conversation_id": str(conv_id) if conv_id else None}

        else:  # pass / reject
            rejection_count = (vibe["rejection_count"] or 0) + 1
            cooldown_hours = 24 if rejection_count == 1 else 24 * 7
            cooldown_until = datetime.utcnow() + timedelta(hours=cooldown_hours)

            cur.execute(
                """
                UPDATE vibe_requests
                SET status = 'passed', passed_at = NOW(),
                    rejection_count = %s,
                    cooldown_until = %s
                WHERE id = %s::uuid
                """,
                (rejection_count, cooldown_until, vibe_id),
            )
            conn.commit()
            return {"ok": True, "status": "passed"}

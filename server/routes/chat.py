import asyncio
import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db
from utils.jwt import decode_token
from utils.push import send_push
from utils.link_preview import fetch_link_preview, UnsafeUrlError

router = APIRouter(tags=["chat"])

# Must match the `limit` default on GET /messages below — it's the only page size
# the client ever requests, so it's the only one ever cached/invalidated.
DEFAULT_MSG_PAGE_SIZE = 20
MSG_CACHE_TTL_SECONDS = 120


def _msg_cache_key(conv_id: str) -> str:
    return f"conv_msgs:{conv_id}:{DEFAULT_MSG_PAGE_SIZE}"


# ── In-memory socket registry (fallback when Redis is unavailable) ────────────

_conv_sockets: dict[str, set] = {}
# Per-user sockets for the conversation LIST screen — lets it reorder/update
# live (like WhatsApp) without being connected to any specific conversation's
# /ws/chat/{conv_id} room.
_user_sockets: dict[str, set] = {}


async def _broadcast_local(conv_id: str, data: dict, exclude=None) -> None:
    """Broadcast directly to every WS in this conversation except the sender."""
    room = _conv_sockets.get(conv_id, set())
    dead = set()
    for ws in list(room):
        if ws is exclude:
            continue
        try:
            await ws.send_text(json.dumps(data))
        except Exception:
            dead.add(ws)
    room -= dead


async def _broadcast_user_local(user_id: str, data: dict) -> None:
    """Push directly to every open inbox socket for this user (their other devices/tabs)."""
    room = _user_sockets.get(user_id, set())
    dead = set()
    for ws in list(room):
        try:
            await ws.send_text(json.dumps(data))
        except Exception:
            dead.add(ws)
    room -= dead


async def _notify_inbox(participant_ids: set[str], conv_id: str) -> None:
    """Tells both participants' conversation-list screens that this
    conversation has a new last message, so they can bump it to the top —
    in-memory first (same-worker), Redis as fallback for multi-server."""
    payload = {"type": "conversation_updated", "conversation_id": conv_id}
    for pid in participant_ids:
        if not pid:
            continue
        await _broadcast_user_local(pid, payload)
        await _publish(f"inbox:{pid}", payload)


# ── Redis helpers ─────────────────────────────────────────────────────────────

_redis = None

async def _get_redis():
    global _redis
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            _redis = aioredis.from_url("redis://localhost:6379", decode_responses=True)
            await _redis.ping()
        except Exception:
            _redis = None
    return _redis


async def _publish(channel: str, data: dict) -> None:
    r = await _get_redis()
    if r:
        try:
            await r.publish(channel, json.dumps(data))
        except Exception:
            pass


# ── Auth helper for WebSocket ─────────────────────────────────────────────────

def _user_from_token(token: str) -> dict:
    payload = decode_token(token)
    user_id = payload.get("sub") if payload else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": user_id}


# ── Pydantic models ───────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    content: Optional[str] = None
    content_type: str = "text"
    metadata: Optional[dict] = None


class MessageReportRequest(BaseModel):
    reason: str
    description: Optional[str] = None


# ── Helper: verify conversation participant ───────────────────────────────────

def _get_conversation(cur, conv_id: str, user_id: str) -> dict:
    cur.execute(
        """
        SELECT id::text, user1_id::text, user2_id::text, status
        FROM conversations
        WHERE id = %s::uuid AND (user1_id = %s::uuid OR user2_id = %s::uuid)
        """,
        (conv_id, user_id, user_id),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return dict(row)


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.get("/chat/link-preview")
async def get_link_preview(url: str = Query(...), current_user: dict = Depends(get_current_user)):
    """Fetches OG title/description/image for a link shared in chat — the
    same kind of unfurl WhatsApp/Instagram/iMessage do. Requires auth (like
    every other endpoint here) mainly to keep this from being an open proxy."""
    try:
        return await fetch_link_preview(url)
    except UnsafeUrlError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        # Fetch/parse failures shouldn't break the chat UI — the client falls
        # back to a plain link when title/description/image all come back None.
        return {"url": url, "hostname": None, "title": None, "description": None, "image": None}


@router.get("/chat/conversations")
def list_conversations(
    current_user: dict = Depends(get_current_user),
    active_limit: int = Query(20, ge=1, le=100),
    active_offset: int = Query(0, ge=0),
    include_hidden: bool = Query(False),
):
    uid = current_user["id"]
    hidden_filter_sql = (
        ""
        if include_hidden
        else "\n              AND NOT (%s::uuid = ANY(COALESCE(c.hidden_by, '{}'::uuid[])))"
    )
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                c.id::text,
                c.status,
                c.last_message_at,
                c.user1_id::text,
                c.user2_id::text,
                -- Partner info
                CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END AS partner_id,
                CASE WHEN c.user1_id = %s::uuid THEN u2.name ELSE u1.name END AS partner_name,
                CASE WHEN c.user1_id = %s::uuid THEN u2.username ELSE u1.username END AS partner_username,
                CASE WHEN c.user1_id = %s::uuid THEN p2.url ELSE p1.url END AS partner_avatar,
                CASE WHEN c.user1_id = %s::uuid THEN COALESCE(u2.is_deleted, FALSE) ELSE COALESCE(u1.is_deleted, FALSE) END AS partner_is_deleted,
                CASE WHEN c.user1_id = %s::uuid THEN u2.public_key ELSE u1.public_key END AS partner_public_key,
                -- Last message
                m.content AS last_message,
                m.content_type AS last_message_type,
                m.sender_id::text AS last_sender_id,
                m.sent_at AS last_sent_at,
                (m.unsent_at IS NOT NULL) AS last_unsent,
                -- Unread count (messages not read by current user sent by partner)
                (
                    SELECT COUNT(*) FROM messages msg
                    WHERE msg.conversation_id = c.id
                      AND msg.sender_id != %s::uuid
                      AND msg.read_at IS NULL
                )::int AS unread_count,
                -- Block status from current user's perspective
                CASE
                    WHEN EXISTS(
                        SELECT 1 FROM user_blocks
                        WHERE blocker_id = %s::uuid
                          AND blocked_id = CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END
                    ) THEN 'i_blocked'
                    WHEN EXISTS(
                        SELECT 1 FROM user_blocks
                        WHERE blocker_id = CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END
                          AND blocked_id = %s::uuid
                    ) THEN 'they_blocked'
                    ELSE 'none'
                END AS block_status
            FROM conversations c
            JOIN users u1 ON u1.id = c.user1_id
            JOIN users u2 ON u2.id = c.user2_id
            LEFT JOIN LATERAL (
                SELECT url FROM user_photos
                WHERE user_id = c.user1_id ORDER BY position LIMIT 1
            ) p1 ON true
            LEFT JOIN LATERAL (
                SELECT url FROM user_photos
                WHERE user_id = c.user2_id ORDER BY position LIMIT 1
            ) p2 ON true
            LEFT JOIN LATERAL (
                SELECT content, content_type, sender_id, sent_at, unsent_at FROM messages
                WHERE conversation_id = c.id
                  AND NOT (%s::uuid = ANY(COALESCE(deleted_for, '{}'::uuid[])))
                ORDER BY sent_at DESC LIMIT 1
            ) m ON true
            WHERE (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)""" + hidden_filter_sql + """
            ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            """,
            (uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid) + (() if include_hidden else (uid,)),
        )
        rows = cur.fetchall()

    all_convs = []
    for r in rows:
        d = dict(r)
        d["partner_id"] = str(d["partner_id"])
        all_convs.append(d)

    pending = [c for c in all_convs if c["status"] == "pending" and c["last_sender_id"] != uid]
    active_all = [c for c in all_convs if c["status"] == "active"]
    locked = [c for c in all_convs if c["status"] == "pending" and c["last_sender_id"] == uid]

    active_page = active_all[active_offset:active_offset + active_limit]
    has_more = active_offset + active_limit < len(active_all)

    return {
        "pending": pending,
        "active": active_page,
        "locked": locked,
        "active_total": len(active_all),
        "has_more": has_more,
    }


@router.get("/chat/conversations/{conv_id}/partner-key")
def get_partner_key(conv_id: str, current_user: dict = Depends(get_current_user)):
    """Returns the other participant's X25519 public key for end-to-end
    encrypting/decrypting this conversation's messages client-side."""
    uid = current_user["id"]
    with get_db() as (cur, _):
        conv = _get_conversation(cur, conv_id, uid)
        partner_id = conv["user2_id"] if conv["user1_id"] == uid else conv["user1_id"]
        cur.execute("SELECT public_key FROM users WHERE id = %s::uuid", (partner_id,))
        row = cur.fetchone()
    return {"partner_id": partner_id, "partner_public_key": row["public_key"] if row else None}


@router.get("/chat/conversations/{conv_id}/messages")
async def list_messages(
    conv_id: str,
    before: Optional[str] = Query(None),
    limit: int = Query(DEFAULT_MSG_PAGE_SIZE, le=100),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, _):
        conv = _get_conversation(cur, conv_id, uid)
        if conv["status"] != "active":
            raise HTTPException(status_code=403, detail="Conversation not yet active")

    # Redis cache for the initial page (no cursor, default page size) — TTL 120s.
    # The cache holds the RAW rows shared across both participants, so "deleted
    # for me" filtering must happen per-request below, never baked into the
    # cached payload. Only the default page size is cached/invalidated — a
    # non-default `limit` always goes straight to the DB.
    cacheable = not before and limit == DEFAULT_MSG_PAGE_SIZE
    cache_key = _msg_cache_key(conv_id)
    cached_result = None
    if cacheable:
        r = await _get_redis()
        if r:
            try:
                cached = await r.get(cache_key)
                if cached:
                    cached_result = json.loads(cached)
            except Exception:
                pass

    if cached_result is not None:
        result = cached_result
    else:
        with get_db() as (cur, _):
            if before:
                cur.execute(
                    """
                    SELECT id::text, conversation_id::text, sender_id::text,
                           content, content_type, metadata, sent_at, read_at, reactions,
                           unsent_at, edited_at, deleted_for
                    FROM messages
                    WHERE conversation_id = %s::uuid AND sent_at < %s
                    ORDER BY sent_at DESC
                    LIMIT %s
                    """,
                    (conv_id, before, limit),
                )
            else:
                cur.execute(
                    """
                    SELECT id::text, conversation_id::text, sender_id::text,
                           content, content_type, metadata, sent_at, read_at, reactions,
                           unsent_at, edited_at, deleted_for
                    FROM messages
                    WHERE conversation_id = %s::uuid
                    ORDER BY sent_at DESC
                    LIMIT %s
                    """,
                    (conv_id, limit),
                )
            rows = cur.fetchall()

        result = []
        for r_row in rows:
            d = dict(r_row)
            if d.get("sent_at"):
                d["sent_at"] = d["sent_at"].isoformat()
            if d.get("unsent_at"):
                d["unsent_at"] = d["unsent_at"].isoformat()
            if d.get("edited_at"):
                d["edited_at"] = d["edited_at"].isoformat()
            result.append(d)

        # Cache the initial page (raw, unfiltered)
        if cacheable:
            r = await _get_redis()
            if r:
                try:
                    await r.set(cache_key, json.dumps(result), ex=MSG_CACHE_TTL_SECONDS)
                except Exception:
                    pass

    # Per-request filtering: hide messages this user deleted-for-themselves,
    # and never leak the deleted_for list itself to any client.
    result = [m for m in result if uid not in (m.get("deleted_for") or [])]
    for m in result:
        m.pop("deleted_for", None)

    return result


@router.patch("/chat/conversations/{conv_id}/read")
def mark_read(conv_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        _get_conversation(cur, conv_id, uid)
        cur.execute(
            """
            UPDATE messages SET read_at = NOW()
            WHERE conversation_id = %s::uuid
              AND sender_id != %s::uuid
              AND read_at IS NULL
            """,
            (conv_id, uid),
        )
        conn.commit()
    return {"ok": True}


@router.delete("/chat/conversations/{conv_id}", status_code=200)
def delete_conversation(conv_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        _get_conversation(cur, conv_id, uid)
        cur.execute(
            """
            UPDATE conversations
            SET hidden_by = array_append(
                COALESCE(hidden_by, '{}'::uuid[]),
                %s::uuid
            )
            WHERE id = %s::uuid
              AND NOT (%s::uuid = ANY(COALESCE(hidden_by, '{}'::uuid[])))
            """,
            (uid, conv_id, uid),
        )
        conn.commit()
    return {"ok": True}


@router.post("/chat/messages/{msg_id}/report", status_code=200)
def report_message(
    msg_id: str,
    body: MessageReportRequest,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.id::text
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = %s::uuid AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
            """,
            (msg_id, uid, uid),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Message not found")
        try:
            cur.execute(
                """
                INSERT INTO message_reports (message_id, reporter_id, reason, description)
                VALUES (%s::uuid, %s::uuid, %s, %s)
                """,
                (msg_id, uid, body.reason, body.description),
            )
            from routes.notifications import notify_report_submitted
            notify_report_submitted(cur, uid, "message", msg_id)
            conn.commit()
        except Exception:
            # Already reported by this user (unique constraint) — treat as success
            conn.rollback()
    return {"ok": True}


@router.post("/chat/messages/{msg_id}/unsend", status_code=200)
async def unsend_message(msg_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT id::text, conversation_id::text, sender_id::text FROM messages WHERE id = %s::uuid",
            (msg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Message not found")
        row = dict(row)
        if row["sender_id"] != uid:
            raise HTTPException(status_code=403, detail="You can only unsend your own messages")
        conv_id = row["conversation_id"]
        cur.execute(
            "UPDATE messages SET content = NULL, metadata = NULL, reactions = NULL, unsent_at = NOW() WHERE id = %s::uuid",
            (msg_id,),
        )
        conn.commit()

    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception:
            pass
    payload = {"type": "message_unsent", "message_id": msg_id, "conversation_id": conv_id}
    await _broadcast_local(conv_id, payload)
    await _publish(f"conv:{conv_id}", payload)
    return {"ok": True}


EDIT_WINDOW_MINUTES = 15


class EditMessageBody(BaseModel):
    content: str


@router.patch("/chat/messages/{msg_id}", status_code=200)
async def edit_message(msg_id: str, body: EditMessageBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message can't be empty")

    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT id::text, conversation_id::text, sender_id::text,
                   content_type, unsent_at, sent_at
            FROM messages WHERE id = %s::uuid
            """,
            (msg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Message not found")
        row = dict(row)
        if row["sender_id"] != uid:
            raise HTTPException(status_code=403, detail="You can only edit your own messages")
        if row["content_type"] != "text":
            raise HTTPException(status_code=422, detail="Only text messages can be edited")
        if row["unsent_at"] is not None:
            raise HTTPException(status_code=422, detail="This message was unsent")

        sent_at = row["sent_at"]
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - sent_at > timedelta(minutes=EDIT_WINDOW_MINUTES):
            raise HTTPException(status_code=422, detail=f"Editing window has passed ({EDIT_WINDOW_MINUTES} min)")

        conv_id = row["conversation_id"]
        cur.execute(
            "UPDATE messages SET content = %s, edited_at = NOW() WHERE id = %s::uuid RETURNING edited_at",
            (content, msg_id),
        )
        edited_at = cur.fetchone()["edited_at"].isoformat()
        conn.commit()

    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception:
            pass
    payload = {
        "type": "message_edited", "message_id": msg_id, "conversation_id": conv_id,
        "content": content, "edited_at": edited_at,
    }
    await _broadcast_local(conv_id, payload)
    await _publish(f"conv:{conv_id}", payload)
    return {"ok": True, "content": content, "edited_at": edited_at}


@router.post("/chat/messages/{msg_id}/delete-for-me", status_code=200)
def delete_message_for_me(msg_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.id::text
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = %s::uuid AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
            """,
            (msg_id, uid, uid),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Message not found")
        cur.execute(
            """
            UPDATE messages
            SET deleted_for = array_append(COALESCE(deleted_for, '{}'::uuid[]), %s::uuid)
            WHERE id = %s::uuid
              AND NOT (%s::uuid = ANY(COALESCE(deleted_for, '{}'::uuid[])))
            """,
            (uid, msg_id, uid),
        )
        conn.commit()
    return {"ok": True}


@router.post("/chat/conversations/{conv_id}/messages", status_code=201)
async def send_message_rest(
    conv_id: str,
    body: SendMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    partner_id = None
    with get_db() as (cur, conn):
        conv = _get_conversation(cur, conv_id, uid)
        if conv["status"] != "active":
            raise HTTPException(status_code=403, detail="Conversation not yet active")

        partner_id = conv["user2_id"] if conv["user1_id"] == uid else conv["user1_id"]

        # Same block check as the WS "message" path — the REST endpoint used
        # to skip this entirely, which meant anything sent through it
        # (voice fallback, and now ShareToChatSheet) could bypass a block.
        cur.execute(
            """
            SELECT 1 FROM user_blocks
            WHERE (blocker_id = %s::uuid AND blocked_id = %s::uuid)
               OR (blocker_id = %s::uuid AND blocked_id = %s::uuid)
            """,
            (uid, partner_id, partner_id, uid),
        )
        if cur.fetchone():
            raise HTTPException(status_code=403, detail="You can't message this person")

        cur.execute(
            """
            INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s)
            RETURNING id::text, sender_id::text, content, content_type, metadata, sent_at
            """,
            (conv_id, uid, body.content, body.content_type, json.dumps(body.metadata) if body.metadata else None),
        )
        msg = dict(cur.fetchone())
        cur.execute(
            "UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid",
            (conv_id,),
        )
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        sender_row = cur.fetchone()
        sender_name = sender_row["name"] if sender_row else "Someone"
        conn.commit()

    out = {**msg, "sent_at": msg["sent_at"].isoformat()}
    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception:
            pass
    asyncio.create_task(_publish(f"conv:{conv_id}", {"type": "message", **out}))
    asyncio.create_task(_notify_inbox({uid, partner_id}, conv_id))

    if partner_id:
        # Text content is end-to-end encrypted — the server can't read it to
        # build a preview, so text messages get the same generic copy media does.
        preview = "Sent you a message"
        background_tasks.add_task(
            send_push, partner_id, sender_name, preview,
            {"type": "conversation", "conv_id": conv_id},
        )

    return out


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/chat/{conv_id}")
async def chat_websocket(
    conv_id: str,
    websocket: WebSocket,
    token: str = Query(...),
):
    # Auth
    try:
        user = _user_from_token(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    uid = user["id"]
    partner_id: str | None = None

    # Verify participant + active status, fetch partner_id for block checks
    try:
        with get_db() as (cur, _):
            cur.execute(
                """
                SELECT id::text, status, user1_id::text, user2_id::text FROM conversations
                WHERE id = %s::uuid AND (user1_id = %s::uuid OR user2_id = %s::uuid)
                  AND status = 'active'
                """,
                (conv_id, uid, uid),
            )
            conv_row = cur.fetchone()
            if not conv_row:
                await websocket.close(code=4003)
                return
            conv_row = dict(conv_row)
            partner_id = conv_row["user2_id"] if conv_row["user1_id"] == uid else conv_row["user1_id"]
    except Exception:
        await websocket.close(code=4003)
        return

    await websocket.accept()

    # Register this socket for direct in-memory broadcast
    _conv_sockets.setdefault(conv_id, set()).add(websocket)

    r = await _get_redis()

    async def redis_listener():
        if not r:
            return
        try:
            async with r.pubsub() as ps:
                await ps.subscribe(f"conv:{conv_id}")
                async for raw in ps.listen():
                    if raw["type"] != "message":
                        continue
                    data = json.loads(raw["data"])
                    # Don't echo back to sender
                    if data.get("sender_id") != uid:
                        try:
                            await websocket.send_text(json.dumps(data))
                        except Exception:
                            break
        except Exception:
            pass

    listener_task = asyncio.create_task(redis_listener())

    # Mark user online
    if r:
        await r.set(f"online:{uid}", "1", ex=35)

    try:
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
            except asyncio.TimeoutError:
                # Keepalive ping
                await websocket.send_text(json.dumps({"type": "pong"}))
                if r:
                    await r.set(f"online:{uid}", "1", ex=35)
                continue

            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                if r:
                    await r.set(f"online:{uid}", "1", ex=35)

            elif msg_type == "typing":
                payload = {
                    "type": "typing",
                    "user_id": uid,
                    "is_typing": data.get("is_typing", False),
                    "mode": data.get("mode", "text"),
                }
                await _broadcast_local(conv_id, payload, exclude=websocket)
                await _publish(f"conv:{conv_id}", payload)

            elif msg_type == "read":
                with get_db() as (cur, conn):
                    cur.execute(
                        """
                        UPDATE messages SET read_at = NOW()
                        WHERE conversation_id = %s::uuid
                          AND sender_id != %s::uuid AND read_at IS NULL
                        """,
                        (conv_id, uid),
                    )
                    conn.commit()
                await _publish(f"conv:{conv_id}", {"type": "read", "user_id": uid})

            elif msg_type == "reaction":
                msg_id = data.get("message_id")
                emoji = data.get("emoji")
                if msg_id and emoji:
                    # Get message author for push notification
                    with get_db() as (cur, _):
                        cur.execute(
                            "SELECT sender_id::text FROM messages WHERE id = %s::uuid AND conversation_id = %s::uuid",
                            (msg_id, conv_id),
                        )
                        msg_row = cur.fetchone()
                        msg_author_id = msg_row["sender_id"] if msg_row else None
                        if msg_author_id and msg_author_id != uid:
                            cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
                            reactor_row = cur.fetchone()
                            reactor_name = reactor_row["name"] if reactor_row else "Someone"
                            asyncio.create_task(asyncio.to_thread(
                                send_push, msg_author_id, f"{reactor_name} reacted",
                                f"{reactor_name} reacted to your message",
                                {"type": "conversation", "conv_id": conv_id},
                            ))
                if msg_id:
                    with get_db() as (cur, conn):
                        if emoji:
                            cur.execute(
                                "UPDATE messages SET reactions = COALESCE(reactions, '{}'::jsonb) || %s::jsonb "
                                "WHERE id = %s::uuid AND conversation_id = %s::uuid",
                                (json.dumps({uid: emoji}), msg_id, conv_id),
                            )
                        else:
                            cur.execute(
                                "UPDATE messages SET reactions = COALESCE(reactions, '{}'::jsonb) - %s "
                                "WHERE id = %s::uuid AND conversation_id = %s::uuid",
                                (uid, msg_id, conv_id),
                            )
                        conn.commit()
                    payload = {"type": "reaction", "message_id": msg_id, "user_id": uid, "emoji": emoji}
                    await websocket.send_text(json.dumps(payload))
                    await _broadcast_local(conv_id, payload, exclude=websocket)
                    await _publish(f"conv:{conv_id}", payload)

            elif msg_type == "message":
                content = data.get("content")
                content_type = data.get("content_type", "text")
                metadata = data.get("metadata")

                # Block check before inserting
                if partner_id:
                    with get_db() as (cur, _):
                        cur.execute(
                            """
                            SELECT 1 FROM user_blocks
                            WHERE (blocker_id = %s::uuid AND blocked_id = %s::uuid)
                               OR (blocker_id = %s::uuid AND blocked_id = %s::uuid)
                            """,
                            (uid, partner_id, partner_id, uid),
                        )
                        if cur.fetchone():
                            await websocket.send_text(json.dumps({"type": "error", "code": "blocked"}))
                            continue

                try:
                    with get_db() as (cur, conn):
                        cur.execute(
                            """
                            INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata)
                            VALUES (%s::uuid, %s::uuid, %s, %s, %s)
                            RETURNING id::text, conversation_id::text, sender_id::text,
                                      content, content_type, metadata, sent_at, read_at, reactions
                            """,
                            (conv_id, uid, content, content_type,
                             json.dumps(metadata) if metadata else None),
                        )
                        msg = dict(cur.fetchone())
                        cur.execute(
                            "UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid",
                            (conv_id,),
                        )
                        conn.commit()
                except Exception as db_err:
                    print(f"[WS] message insert failed: {db_err}", flush=True)
                    await websocket.send_text(json.dumps({"type": "error", "code": "send_failed"}))
                    continue

                out = {
                    "type": "message",
                    **msg,
                    "sent_at": msg["sent_at"].isoformat(),
                }
                # Invalidate the cached initial message page for this conversation
                if r:
                    try:
                        await r.delete(_msg_cache_key(conv_id))
                    except Exception:
                        pass
                # Echo back to sender immediately
                await websocket.send_text(json.dumps(out))
                # Broadcast to partner — in-memory first (always works), Redis as fallback for multi-server
                await _broadcast_local(conv_id, out, exclude=websocket)
                await _publish(f"conv:{conv_id}", out)
                await _notify_inbox({uid, partner_id}, conv_id)

                # Push notification to partner
                if partner_id:
                    with get_db() as (cur, _):
                        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
                        ws_sender_row = cur.fetchone()
                        ws_sender_name = ws_sender_row["name"] if ws_sender_row else "Someone"
                    # Text content is end-to-end encrypted — server can't preview it.
                    ws_preview = "Sent you a message"
                    asyncio.create_task(asyncio.to_thread(
                        send_push, partner_id, ws_sender_name, ws_preview,
                        {"type": "conversation", "conv_id": conv_id},
                    ))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] chat/{conv_id} unexpected error: {e}", flush=True)
    finally:
        listener_task.cancel()
        # Deregister from in-memory room
        _conv_sockets.get(conv_id, set()).discard(websocket)
        if r:
            try:
                await r.delete(f"online:{uid}")
            except Exception:
                pass


@router.websocket("/ws/inbox")
async def inbox_websocket(websocket: WebSocket, token: str = Query(...)):
    """One socket per open conversation-list screen. Doesn't join any
    conversation room — it only receives `conversation_updated` pings (see
    _notify_inbox above) so the list can bump the right row to the top and
    refetch, the same way WhatsApp's chat list updates live."""
    try:
        user = _user_from_token(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    uid = user["id"]
    await websocket.accept()
    _user_sockets.setdefault(uid, set()).add(websocket)

    r = await _get_redis()

    async def redis_listener():
        if not r:
            return
        try:
            async with r.pubsub() as ps:
                await ps.subscribe(f"inbox:{uid}")
                async for raw in ps.listen():
                    if raw["type"] != "message":
                        continue
                    try:
                        await websocket.send_text(raw["data"])
                    except Exception:
                        break
        except Exception:
            pass

    listener_task = asyncio.create_task(redis_listener())

    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] inbox/{uid} unexpected error: {e}", flush=True)
    finally:
        listener_task.cancel()
        _user_sockets.get(uid, set()).discard(websocket)

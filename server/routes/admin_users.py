from datetime import timedelta
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel

from db.config import get_db
from middleware.admin_auth import get_current_admin
from utils.push import send_push
from utils.account_purge import PURGE_AFTER_DAYS
from utils.admin_audit import log_action

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

VALID_STATUSES = {"active", "deleted"}


class LockBody(BaseModel):
    reason: str


def _with_purge_at(row: dict) -> dict:
    """Adds `purge_at` (deleted_at + PURGE_AFTER_DAYS) for deleted accounts —
    the date the 30-day "email us to recover" window closes and
    utils/account_purge.py hard-deletes the row for good."""
    row["purge_at"] = (row["deleted_at"] + timedelta(days=PURGE_AFTER_DAYS)) if row.get("deleted_at") else None
    return row


# ── GET /admin/users ──────────────────────────────────────────────────────────

@router.get("")
def list_users(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    if status and status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUSES)}")

    offset = (page - 1) * page_size
    filters = []
    params: list = []

    if q:
        filters.append("(u.name ILIKE %s OR u.username ILIKE %s OR u.phone ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like, like])

    if status == "active":
        filters.append("COALESCE(u.is_deleted, FALSE) = FALSE")
    elif status == "deleted":
        filters.append("COALESCE(u.is_deleted, FALSE) = TRUE")

    where = f"WHERE {' AND '.join(filters)}" if filters else ""

    with get_db() as (cur, _):
        cur.execute(f"SELECT COUNT(*)::int AS count FROM users u {where}", params)
        total = cur.fetchone()["count"]

        cur.execute(
            f"""
            SELECT
                u.id::text, u.name, u.username, u.phone, u.country_code, u.city,
                u.wallet_balance, u.is_active, COALESCE(u.is_deleted, FALSE) AS is_deleted,
                u.deleted_at, COALESCE(u.is_locked, FALSE) AS is_locked, u.created_at,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS avatar
            FROM users u
            {where}
            ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = [_with_purge_at(dict(r)) for r in cur.fetchall()]

    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/users/{user_id} ────────────────────────────────────────────────

@router.get("/{user_id}")
def get_user_detail(user_id: str, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                id::text, phone, country_code, name, dob, gender, city, bio,
                interests, badges, username, voice_url, wallet_balance,
                profile_complete, is_active, COALESCE(is_deleted, FALSE) AS is_deleted,
                deleted_at, COALESCE(is_locked, FALSE) AS is_locked, locked_reason,
                locked_at, locked_by::text, is_host_onboarding_finished,
                created_at, updated_at
            FROM users WHERE id = %s::uuid
            """,
            (user_id,),
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user = _with_purge_at(dict(user))

        cur.execute(
            "SELECT id::text, url, position, created_at FROM user_photos WHERE user_id = %s::uuid ORDER BY position",
            (user_id,),
        )
        photos = cur.fetchall()

        cur.execute(
            """
            SELECT id::text, title, event_type, date_time, price_inr, is_cancelled,
                   spots_left, capacity, created_at,
                   COALESCE(cover_photos, '[]'::jsonb) AS cover_photos
            FROM events WHERE host_id = %s::uuid ORDER BY date_time DESC LIMIT 50
            """,
            (user_id,),
        )
        hosted_events = cur.fetchall()

        cur.execute(
            """
            SELECT e.id::text, e.title, e.event_type, e.date_time, e.price_inr,
                   ea.status, ea.joined_at, ea.checked_in_at
            FROM event_attendees ea
            JOIN events e ON e.id = ea.event_id
            WHERE ea.user_id = %s::uuid ORDER BY ea.joined_at DESC LIMIT 50
            """,
            (user_id,),
        )
        joined_events = cur.fetchall()

        cur.execute(
            """
            SELECT id::text, amount_inr, type, source, description, expires_at, created_at
            FROM wallet_transactions WHERE user_id = %s::uuid ORDER BY created_at DESC LIMIT 50
            """,
            (user_id,),
        )
        wallet_transactions = cur.fetchall()

        cur.execute(
            """
            SELECT ur.id::text, ur.reason, ur.created_at, u.name AS reported_name, u.id::text AS reported_id
            FROM user_reports ur JOIN users u ON u.id = ur.reported_id
            WHERE ur.reporter_id = %s::uuid ORDER BY ur.created_at DESC
            """,
            (user_id,),
        )
        reports_filed = cur.fetchall()

        cur.execute(
            """
            SELECT ur.id::text, ur.reason, ur.created_at, u.name AS reporter_name, u.id::text AS reporter_id
            FROM user_reports ur JOIN users u ON u.id = ur.reporter_id
            WHERE ur.reported_id = %s::uuid ORDER BY ur.created_at DESC
            """,
            (user_id,),
        )
        reports_received = cur.fetchall()

        cur.execute(
            """
            SELECT ub.id::text, ub.created_at, u.name, u.id::text AS user_id
            FROM user_blocks ub JOIN users u ON u.id = ub.blocked_id
            WHERE ub.blocker_id = %s::uuid ORDER BY ub.created_at DESC
            """,
            (user_id,),
        )
        blocked_by_user = cur.fetchall()

        cur.execute(
            """
            SELECT ub.id::text, ub.created_at, u.name, u.id::text AS user_id
            FROM user_blocks ub JOIN users u ON u.id = ub.blocker_id
            WHERE ub.blocked_id = %s::uuid ORDER BY ub.created_at DESC
            """,
            (user_id,),
        )
        blocked_the_user = cur.fetchall()

        cur.execute(
            "SELECT id::text, topic, message, status, created_at FROM support_requests WHERE user_id = %s::uuid ORDER BY created_at DESC",
            (user_id,),
        )
        support_requests = cur.fetchall()

        cur.execute(
            "SELECT id::text, text, created_at FROM app_feedback WHERE user_id = %s::uuid ORDER BY created_at DESC",
            (user_id,),
        )
        app_feedback = cur.fetchall()

        cur.execute(
            """
            SELECT vr.id::text, vr.status, vr.created_at, u.name, u.id::text AS user_id
            FROM vibe_requests vr JOIN users u ON u.id = vr.receiver_id
            WHERE vr.sender_id = %s::uuid ORDER BY vr.created_at DESC LIMIT 50
            """,
            (user_id,),
        )
        vibe_requests_sent = cur.fetchall()

        cur.execute(
            """
            SELECT vr.id::text, vr.status, vr.created_at, u.name, u.id::text AS user_id
            FROM vibe_requests vr JOIN users u ON u.id = vr.sender_id
            WHERE vr.receiver_id = %s::uuid ORDER BY vr.created_at DESC LIMIT 50
            """,
            (user_id,),
        )
        vibe_requests_received = cur.fetchall()

    return {
        "user": user,
        "photos": photos,
        "hosted_events": hosted_events,
        "joined_events": joined_events,
        "wallet_transactions": wallet_transactions,
        "reports_filed": reports_filed,
        "reports_received": reports_received,
        "blocked_by_user": blocked_by_user,
        "blocked_the_user": blocked_the_user,
        "support_requests": support_requests,
        "app_feedback": app_feedback,
        "vibe_requests_sent": vibe_requests_sent,
        "vibe_requests_received": vibe_requests_received,
    }


# ── PATCH /admin/users/{user_id}/lock ─────────────────────────────────────────

@router.patch("/{user_id}/lock")
def lock_user(user_id: str, body: LockBody, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, conn):
        cur.execute("SELECT id FROM users WHERE id = %s::uuid", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        cur.execute(
            """
            UPDATE users SET is_locked = TRUE, locked_reason = %s, locked_at = NOW(), locked_by = %s::uuid
            WHERE id = %s::uuid
            """,
            (body.reason, current_admin["id"], user_id),
        )
        # Refresh tokens are the actual session — killing these means the very
        # next token refresh fails. The is_locked check in get_current_user
        # rejects the current access token immediately regardless, on the
        # user's next API call. device_tokens are left alone so the push
        # notification below can still reach the device.
        cur.execute("DELETE FROM refresh_tokens WHERE user_id = %s::uuid", (user_id,))
        conn.commit()

    log_action(current_admin["id"], "lock_user", "user", user_id, body.reason)

    try:
        send_push(user_id, "Account Locked", f"Your account has been locked by the Gorave team. Reason: {body.reason}")
    except Exception:
        pass

    return {"ok": True}


# ── PATCH /admin/users/{user_id}/unlock ───────────────────────────────────────

@router.patch("/{user_id}/unlock")
def unlock_user(user_id: str, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, conn):
        cur.execute("SELECT id FROM users WHERE id = %s::uuid", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        cur.execute(
            "UPDATE users SET is_locked = FALSE, locked_reason = NULL, locked_at = NULL, locked_by = NULL WHERE id = %s::uuid",
            (user_id,),
        )
        conn.commit()

    log_action(current_admin["id"], "unlock_user", "user", user_id)

    try:
        send_push(user_id, "Account Unlocked", "Your account has been unlocked — welcome back to Gorave!")
    except Exception:
        pass

    return {"ok": True}

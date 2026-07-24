from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks

from db.config import get_db
from middleware.admin_auth import get_current_admin
from routes.events import _cancel_event_and_refund
from utils.admin_audit import log_action

router = APIRouter(prefix="/admin/events", tags=["admin-events"])

VALID_STATUSES = {"active", "upcoming", "past", "cancelled"}

# "Active" = ongoing right now (between date_time and end_time) — distinct from
# "upcoming" (hasn't started) and "past" (has ended). Events without an
# end_time (legacy rows predating the required field) are treated as ending
# the instant they start, so they fall through to "past" once date_time has
# elapsed rather than being stuck "active" forever.
_ACTIVE_SQL = "e.is_cancelled = FALSE AND e.date_time <= NOW() AND COALESCE(e.end_time, e.date_time) >= NOW()"
_UPCOMING_SQL = "e.is_cancelled = FALSE AND e.date_time > NOW()"
_PAST_SQL = "e.is_cancelled = FALSE AND COALESCE(e.end_time, e.date_time) < NOW()"


def _normalize_cover_photos(row: dict) -> dict:
    """events.cover_photos is stored as a plain jsonb array of URL strings —
    the mobile app's own endpoints (routes/events.py) convert this to
    {url, position} objects before returning JSON; mirror that here so the
    admin ImageSlider gets the same shape."""
    photos = row.get("cover_photos") or []
    if isinstance(photos, list) and photos and isinstance(photos[0], str):
        row["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos)]
    return row


# ── GET /admin/events ──────────────────────────────────────────────────────────

@router.get("")
def list_events(
    status: str | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    if status and status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUSES)}")

    offset = (page - 1) * page_size
    filters = []
    params: list = []

    if status == "active":
        filters.append(_ACTIVE_SQL)
    elif status == "upcoming":
        filters.append(_UPCOMING_SQL)
    elif status == "past":
        filters.append(_PAST_SQL)
    elif status == "cancelled":
        filters.append("e.is_cancelled = TRUE")

    if q:
        filters.append("(e.title ILIKE %s OR u.name ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    # Soonest-first for what's still ahead, most-recent-first for what's done.
    order = "e.date_time ASC" if status in ("active", "upcoming") else "e.date_time DESC"

    with get_db() as (cur, _):
        cur.execute(f"SELECT COUNT(*)::int AS count FROM events e JOIN users u ON u.id = e.host_id {where}", params)
        total = cur.fetchone()["count"]

        cur.execute(
            f"""
            SELECT
                e.id::text, e.title, e.event_type, e.date_time, e.price_inr,
                (e.price_inr = 0) AS is_free, e.platform_fee_inr, e.host_commission_inr,
                e.platform_profit_inr, e.is_cancelled, e.capacity, e.spots_left,
                e.created_at, COALESCE(e.cover_photos, '[]'::jsonb) AS cover_photos,
                u.id::text AS host_id, u.name AS host_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count
            FROM events e
            JOIN users u ON u.id = e.host_id
            {where}
            ORDER BY {order}
            LIMIT %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = [_normalize_cover_photos(dict(r)) for r in cur.fetchall()]

    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/events/{event_id} ──────────────────────────────────────────────

@router.get("/{event_id}")
def get_event_detail(event_id: str, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text, e.title, e.description, e.rules, e.event_type,
                e.date_time, e.end_time, e.capacity, e.spots_left, e.age_restriction,
                e.location_name, e.location_lat, e.location_lng,
                e.price_inr, (e.price_inr = 0) AS is_free,
                e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                COALESCE(e.cover_photos, '[]'::jsonb) AS cover_photos,
                e.is_published, e.is_cancelled, e.created_at, e.updated_at,
                u.id::text AS host_id, u.name AS host_name, u.phone AS host_phone,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM event_reviews WHERE event_id = e.id) AS avg_rating
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE e.id = %s::uuid
            """,
            (event_id,),
        )
        event = cur.fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        event = _normalize_cover_photos(dict(event))

        cur.execute(
            """
            SELECT ea.id::text, ea.status, ea.joined_at, ea.checked_in_at, ea.payment_id,
                   ea.offer_expires_at, u.id::text AS user_id, u.name, u.phone
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s::uuid AND ea.status = 'going'
            ORDER BY ea.joined_at ASC
            """,
            (event_id,),
        )
        attendees = cur.fetchall()

        cur.execute(
            """
            SELECT ea.id::text, ea.joined_at, ea.offer_expires_at,
                   u.id::text AS user_id, u.name, u.phone
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s::uuid AND ea.status = 'waitlist'
            ORDER BY ea.joined_at ASC
            """,
            (event_id,),
        )
        waitlist = cur.fetchall()

        cur.execute(
            """
            SELECT er.id::text, er.rating, er.body, er.created_at,
                   u.id::text AS user_id, u.name
            FROM event_reviews er
            JOIN users u ON u.id = er.reviewer_id
            WHERE er.event_id = %s::uuid ORDER BY er.created_at DESC
            """,
            (event_id,),
        )
        reviews = cur.fetchall()

        cur.execute(
            """
            SELECT er.id::text, er.reason, er.description, er.created_at,
                   u.id::text AS user_id, u.name
            FROM event_reports er
            JOIN users u ON u.id = er.reporter_id
            WHERE er.event_id = %s::uuid ORDER BY er.created_at DESC
            """,
            (event_id,),
        )
        reports = cur.fetchall()

    return {
        "event": event,
        "attendees": attendees,
        "waitlist": waitlist,
        "reviews": reviews,
        "reports": reports,
    }


# ── POST /admin/events/{event_id}/cancel ──────────────────────────────────────

@router.post("/{event_id}/cancel")
def force_cancel_event(event_id: str, background_tasks: BackgroundTasks, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute("SELECT is_cancelled FROM events WHERE id = %s::uuid", (event_id,))
        ev = cur.fetchone()

    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["is_cancelled"]:
        raise HTTPException(status_code=400, detail="Event is already cancelled")

    _cancel_event_and_refund(event_id, background_tasks, cancelled_by_admin=True)
    log_action(current_admin["id"], "force_cancel_event", "event", event_id)
    return {"ok": True}

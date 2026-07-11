from fastapi import APIRouter, BackgroundTasks, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel
from middleware.auth import get_current_user
from db.config import get_db
from utils.push import send_push

router = APIRouter(prefix="/events", tags=["events"])

# Single source of truth for both create and edit, so the two can't drift apart.
MIN_TICKET_PRICE_INR = 99

def _calc_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _promote_next_waitlist(cur, event_id: str) -> dict | None:
    """Promote the next user in the waitlist queue. Holds the spot by decrementing spots_left."""
    cur.execute(
        """
        SELECT ea.id, ea.user_id::text, u.name
        FROM event_attendees ea
        JOIN users u ON u.id = ea.user_id
        WHERE ea.event_id = %s AND ea.status = 'waitlist' AND ea.offer_expires_at IS NULL
        ORDER BY ea.joined_at ASC
        LIMIT 1
        """,
        (event_id,),
    )
    next_row = cur.fetchone()
    if not next_row:
        return None
    cur.execute(
        "UPDATE event_attendees SET offer_expires_at = NOW() + INTERVAL '1 hour' WHERE id = %s",
        (next_row["id"],),
    )
    cur.execute(
        "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s",
        (event_id,),
    )
    return dict(next_row)


def _expire_stale_offers(cur, event_id: str) -> list:
    """Expire promoted users who didn't confirm in time. Returns list of expired user_ids."""
    cur.execute(
        """
        UPDATE event_attendees
        SET status = 'cancelled', blocked_from_rejoin = TRUE, offer_expires_at = NULL
        WHERE event_id = %s AND status = 'waitlist'
          AND offer_expires_at IS NOT NULL AND offer_expires_at < NOW()
        RETURNING user_id::text
        """,
        (event_id,),
    )
    expired = [r["user_id"] for r in cur.fetchall()]
    if not expired:
        return expired

    # Only re-promote if event starts more than 2h from now — under 2h the spot becomes an empty seat
    cur.execute("SELECT date_time FROM events WHERE id = %s", (event_id,))
    ev_row = cur.fetchone()
    ev_dt = ev_row["date_time"] if ev_row else None
    if ev_dt and ev_dt.tzinfo is None:
        ev_dt = ev_dt.replace(tzinfo=timezone.utc)
    waitlist_still_open = ev_dt and ev_dt > datetime.now(timezone.utc) + timedelta(hours=2)

    for _ in expired:
        cur.execute(
            "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
            (event_id,),
        )
        if waitlist_still_open:
            _promote_next_waitlist(cur, event_id)
    return expired


# ── Schemas ───────────────────────────────────────────────────────────────────

class EventPhotoItem(BaseModel):
    url: str
    position: int


class EventSummary(BaseModel):
    id: str
    title: str
    event_type: str
    date_time: str
    end_time: Optional[str] = None
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    waitlist_count: int = 0
    is_waitlist_full: bool = False
    location_lng: Optional[float] = None
    price_inr: int
    is_free: bool
    spots_left: int
    capacity: int
    distance_km: Optional[int] = None
    cover_photos: List[EventPhotoItem] = []
    host_name: Optional[str] = None
    host_avatar: Optional[str] = None
    age_restriction: int
    attendee_count: int = 0
    is_cancelled: bool = False
    # Relationship/relevance signals — only populated by the search-ranked
    # GET /events query (see list_events); default False elsewhere.
    is_following_host: bool = False
    attended_host_before: bool = False
    paid_attended_host_before: bool = False


class EventDetail(EventSummary):
    description: Optional[str] = None
    rules: Optional[str] = None
    host_id: str
    is_cancelled: bool
    cancel_deadline: str
    edit_deadline: str
    my_ticket_token: Optional[str] = None
    my_checked_in_at: Optional[str] = None
    avg_rating: Optional[float] = None
    my_rsvp_status: Optional[str] = None        # 'going' | 'waitlist' | 'cancelled' | None
    my_waitlist_position: Optional[int] = None  # position in queue (1-indexed), None if not on waitlist
    my_offer_expires_at: Optional[str] = None   # ISO string when promoted, else None
    my_review_rating: Optional[int] = None


class CheckinBody(BaseModel):
    ticket_token: str
    method: str = 'qr_scan'  # 'qr_scan' | 'manual_host'


class ReviewBody(BaseModel):
    rating: int
    body: Optional[str] = None


class ReportEventBody(BaseModel):
    reason: str
    description: Optional[str] = None


class CreateEventBody(BaseModel):
    title: str
    event_type: str
    description: Optional[str] = None
    rules: Optional[str] = None
    date_time: str
    end_time: str
    capacity: int = 20
    age_restriction: int = 18
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    price_inr: int = 0
    cover_photos: List[str] = []


class RsvpBody(BaseModel):
    action: str  # "going" | "cancel"


# ── Helpers ────────────────────────────────────────────────────────────────────

def _haversine_sql(me_lat, me_lng):
    return f"""
        ROUND(6371.0 * acos(LEAST(1.0,
            cos(radians({me_lat})) * cos(radians(e.location_lat)) *
            cos(radians(e.location_lng) - radians({me_lng})) +
            sin(radians({me_lat})) * sin(radians(e.location_lat))
        )))::int
    """


# ── GET /events ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[EventSummary])
def list_events(
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    radius_km: Optional[int] = Query(default=50),
    category: Optional[str] = Query(default=None),
    is_free: Optional[bool] = Query(default=None),
    date_range: Optional[str] = Query(default=None),  # tonight | weekend | all
    q: Optional[str] = Query(default=None),
    min_lat: Optional[float] = Query(default=None),
    max_lat: Optional[float] = Query(default=None),
    min_lng: Optional[float] = Query(default=None),
    max_lng: Optional[float] = Query(default=None),
    limit: int = Query(default=30, le=50),
    current_user: dict = Depends(get_current_user),
):
    viewer_id = current_user["id"]

    dist_sql = _haversine_sql(lat, lng) if lat and lng else "NULL::int"

    filters = ["e.is_published = TRUE", "e.is_cancelled = FALSE", "e.date_time > NOW()"]
    filter_params: list = []

    if category:
        filters.append("e.event_type = %s")
        filter_params.append(category)

    if is_free is True:
        filters.append("e.price_inr = 0")
    elif is_free is False:
        filters.append("e.price_inr > 0")

    if date_range == "tonight":
        filters.append("e.date_time::date = CURRENT_DATE")
    elif date_range == "weekend":
        filters.append("EXTRACT(DOW FROM e.date_time) IN (5, 6, 0)")

    if q:
        filters.append("(e.title ILIKE %s OR e.location_name ILIKE %s)")
        like = f"%{q}%"
        filter_params.extend([like, like])

    # Viewport bounds take priority over radius — used by MapLibre's onRegionDidChange
    if min_lat is not None and max_lat is not None and min_lng is not None and max_lng is not None:
        filters.append("e.location_lat BETWEEN %s AND %s")
        filters.append("e.location_lng BETWEEN %s AND %s")
        filter_params.extend([min_lat, max_lat, min_lng, max_lng])
    elif lat and lng and radius_km:
        filters.append(f"""
            6371.0 * acos(LEAST(1.0,
                cos(radians(%s)) * cos(radians(e.location_lat)) *
                cos(radians(e.location_lng) - radians(%s)) +
                sin(radians(%s)) * sin(radians(e.location_lat))
            )) <= %s
        """)
        filter_params.extend([lat, lng, lat, radius_km])

    where = "WHERE " + " AND ".join(filters)

    # Relationship signals — only meaningful (and only used to rank) during an
    # active text search; see the ORDER BY below. Selected unconditionally
    # since they're cheap and useful for the client to show "why" badges.
    relationship_select = """
        EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = %s::uuid AND following_id = e.host_id
        ) AS is_following_host,
        EXISTS(
            SELECT 1 FROM event_attendees ea
            WHERE ea.user_id = %s::uuid AND ea.status = 'going'
              AND ea.event_id IN (SELECT id FROM events WHERE host_id = e.host_id)
        ) AS attended_host_before,
        EXISTS(
            SELECT 1 FROM event_attendees ea
            WHERE ea.user_id = %s::uuid AND ea.status = 'going' AND ea.payment_id IS NOT NULL
              AND ea.event_id IN (SELECT id FROM events WHERE host_id = e.host_id)
        ) AS paid_attended_host_before
    """
    relationship_params = [viewer_id, viewer_id, viewer_id]

    default_order = dist_sql + " ASC NULLS LAST" if lat and lng else "e.date_time ASC"
    if q:
        order_sql = f"""
            paid_attended_host_before DESC,
            attended_host_before DESC,
            is_following_host DESC,
            (LOWER(e.title) = LOWER(%s)) DESC,
            (LOWER(e.title) LIKE LOWER(%s)) DESC,
            {default_order}
        """
        order_params = [q, f"{q}%"]
    else:
        order_sql = default_order
        order_params = []

    sql = f"""
        SELECT
            e.id::text,
            e.title, e.event_type,
            e.date_time::text, e.end_time::text,
            e.location_name, e.location_lat, e.location_lng,
            e.price_inr, (e.price_inr = 0) AS is_free,
            e.spots_left, e.capacity, e.age_restriction,
            e.cover_photos,
            {dist_sql} AS distance_km,
            u.name AS host_name,
            (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
            (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
            {relationship_select}
        FROM events e
        JOIN users u ON u.id = e.host_id
        {where}
        ORDER BY {order_sql}
        LIMIT %s
    """
    params = relationship_params + filter_params + order_params + [limit]

    with get_db() as (cur, _):
        cur.execute(sql, params)
        rows = cur.fetchall()

    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    return result


# ── GET /events/hosted — events I am hosting ─────────────────────────────────

@router.get("/hosted", response_model=List[EventSummary])
def get_hosted_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.price_inr, (e.price_inr = 0) AS is_free,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE e.host_id = %s::uuid
            ORDER BY e.date_time DESC
            """,
            (uid,),
        )
        rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    return result


# ── GET /events/joined — events I have RSVPed to ─────────────────────────────

@router.get("/joined", response_model=List[EventSummary])
def get_joined_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.price_inr, (e.price_inr = 0) AS is_free,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'going'
            ORDER BY e.date_time DESC
            """,
            (uid,),
        )
        rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    return result


# ── GET /events/free-slots ────────────────────────────────────────────────────
# Must be registered BEFORE /{event_id} so FastAPI doesn't swallow "free-slots" as a UUID.

@router.get("/free-slots")
def get_free_slots(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT COUNT(*)::int AS count FROM events
            WHERE host_id = %s::uuid AND price_inr = 0
              AND DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')
                = DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
              AND is_cancelled = FALSE
            """,
            (uid,),
        )
        used = cur.fetchone()["count"]
    today = date.today()
    if today.month == 12:
        resets_on = date(today.year + 1, 1, 1).isoformat()
    else:
        resets_on = date(today.year, today.month + 1, 1).isoformat()
    return {"used": used, "limit": 2, "resets_on": resets_on}


# ── GET /events/{id} ──────────────────────────────────────────────────────────

@router.get("/{event_id}", response_model=EventDetail)
def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text, e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.description, e.rules,
                e.location_name, e.location_lat, e.location_lng,
                e.price_inr, (e.price_inr = 0) AS is_free,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                (e.date_time - INTERVAL '48 hours')::text AS cancel_deadline,
                (e.date_time - INTERVAL '7 hours')::text AS edit_deadline,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
                NULL::int AS distance_km,
                going_ea.ticket_token AS my_ticket_token,
                going_ea.checked_in_at::text AS my_checked_in_at,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM event_reviews WHERE event_id = e.id) AS avg_rating,
                (SELECT rating FROM event_reviews WHERE event_id = e.id AND reviewer_id = %s::uuid LIMIT 1) AS my_review_rating,
                -- Waitlist fields
                (SELECT COUNT(*) FROM event_attendees wl
                 WHERE wl.event_id = e.id AND wl.status = 'waitlist' AND wl.offer_expires_at IS NULL)::int AS waitlist_count,
                (SELECT COUNT(*) FROM event_attendees wl
                 WHERE wl.event_id = e.id AND wl.status = 'waitlist' AND wl.offer_expires_at IS NULL
                )::int >= FLOOR(e.capacity * 0.5) AS is_waitlist_full,
                -- Viewer's RSVP status
                (SELECT ea2.status FROM event_attendees ea2
                 WHERE ea2.event_id = e.id AND ea2.user_id = %s::uuid
                 LIMIT 1) AS my_rsvp_status,
                -- Viewer's waitlist position (NULL if not in regular queue)
                (SELECT COUNT(*) FROM event_attendees pos
                 WHERE pos.event_id = e.id AND pos.status = 'waitlist' AND pos.offer_expires_at IS NULL
                   AND pos.joined_at <= (
                     SELECT joined_at FROM event_attendees
                     WHERE event_id = e.id AND user_id = %s::uuid AND status = 'waitlist' AND offer_expires_at IS NULL
                   )
                )::int AS my_waitlist_position,
                -- Viewer's promotion offer expiry
                (SELECT ea3.offer_expires_at::text FROM event_attendees ea3
                 WHERE ea3.event_id = e.id AND ea3.user_id = %s::uuid
                   AND ea3.status = 'waitlist' AND ea3.offer_expires_at IS NOT NULL
                 LIMIT 1) AS my_offer_expires_at
            FROM events e
            JOIN users u ON u.id = e.host_id
            LEFT JOIN event_attendees going_ea ON going_ea.event_id = e.id AND going_ea.user_id = %s::uuid AND going_ea.status = 'going'
            WHERE e.id = %s
            """,
            (uid, uid, uid, uid, uid, event_id),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    d = dict(row)
    photos_raw = d.get("cover_photos") or []
    d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
    # 0 position means not in regular queue (promoted or not on waitlist)
    if not d.get("my_waitlist_position"):
        d["my_waitlist_position"] = None
    return d


# ── POST /events ──────────────────────────────────────────────────────────────

@router.post("", response_model=EventDetail, status_code=201)
def create_event(body: CreateEventBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Parse and validate date_time
    try:
        dt = datetime.fromisoformat(body.date_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date_time format")

    now = datetime.now(timezone.utc)
    if dt < now + timedelta(hours=24):
        raise HTTPException(status_code=422, detail="Events must be posted at least 24 hours in advance")

    try:
        end_dt = datetime.fromisoformat(body.end_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid end_time format")

    duration = end_dt - dt
    if duration.total_seconds() < 3600:
        raise HTTPException(status_code=422, detail="Event must be at least 1 hour long")
    if duration.total_seconds() > 72 * 3600:
        raise HTTPException(status_code=422, detail="Events can't run longer than 3 days")

    if not (5 <= body.capacity <= 200):
        raise HTTPException(status_code=422, detail="Capacity must be between 5 and 200")

    # Check monthly free event limit
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT COUNT(*)::int AS count FROM events
            WHERE host_id = %s::uuid AND price_inr = 0
              AND DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')
                = DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
              AND is_cancelled = FALSE
            """,
            (uid,),
        )
        free_this_month = cur.fetchone()["count"]

    slots_exhausted = free_this_month >= 2

    if body.price_inr == 0 and slots_exhausted:
        raise HTTPException(status_code=422, detail=f"You've used your 2 free events this month. Set a ticket price (minimum ₹{MIN_TICKET_PRICE_INR}).")
    if body.price_inr != 0 and body.price_inr < MIN_TICKET_PRICE_INR:
        raise HTTPException(status_code=422, detail=f"Minimum ticket price is ₹{MIN_TICKET_PRICE_INR}")

    if body.age_restriction not in (18, 21, 25):
        raise HTTPException(status_code=422, detail="Age restriction must be 18, 21, or 25")

    cover_photos = body.cover_photos or []

    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO events (
                host_id, title, description, rules, event_type,
                date_time, end_time, capacity, spots_left, age_restriction,
                location_name, location_lat, location_lng,
                price_inr, cover_photos, is_published
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s::jsonb, TRUE
            )
            RETURNING id::text
            """,
            (
                current_user["id"], body.title, body.description, body.rules, body.event_type,
                body.date_time, body.end_time, body.capacity, body.capacity, body.age_restriction,
                body.location_name, body.location_lat, body.location_lng,
                body.price_inr, __import__('json').dumps(cover_photos),
            ),
        )
        new_id = cur.fetchone()["id"]

        # Notify followers about the new event
        from routes.notifications import notify_followers_event_created
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (current_user["id"],))
        host_row = cur.fetchone()
        host_name = host_row["name"] if host_row else "Someone"
        notify_followers_event_created(cur, current_user["id"], new_id, body.title, host_name)

        # Collect follower IDs for push delivery after commit
        cur.execute(
            "SELECT follower_id::text FROM follows WHERE following_id = %s::uuid",
            (current_user["id"],),
        )
        follower_ids = [r["follower_id"] for r in cur.fetchall()]
        conn.commit()

    for fid in follower_ids:
        background_tasks.add_task(
            send_push, fid, f"{host_name} posted an event",
            body.title,
            {"type": "event", "event_id": new_id},
        )

    return get_event(new_id, current_user)


# ── PATCH /events/{id} ────────────────────────────────────────────────────────

@router.patch("/{event_id}", response_model=EventDetail)
def update_event(event_id: str, body: CreateEventBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT host_id::text, date_time, capacity, title, description, rules,
                event_type, end_time, age_restriction, location_name, location_lat,
                location_lng, price_inr,
                (SELECT COUNT(*) FROM event_attendees WHERE event_id = %s AND status = 'going')::int AS attendee_count
            FROM events WHERE id = %s
            """,
            (event_id, event_id),
        )
        ev = cur.fetchone()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["host_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your event")

    now = datetime.now(timezone.utc)
    dt = ev["date_time"]
    dt = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
    edit_deadline = dt - timedelta(hours=7)
    capacity_deadline = dt - timedelta(hours=2)
    ed = edit_deadline.replace(tzinfo=timezone.utc) if edit_deadline.tzinfo is None else edit_deadline

    capacity_increasing = body.capacity > ev["capacity"]
    capacity_decreasing = body.capacity < ev["capacity"]

    # Determine if any non-capacity fields have changed
    def _parse_dt(s):
        try: return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None
        except: return None
    body_dt = _parse_dt(body.date_time)
    ev_dt   = ev["date_time"].replace(tzinfo=timezone.utc) if ev["date_time"].tzinfo is None else ev["date_time"]
    body_end = _parse_dt(body.end_time) if body.end_time else None
    ev_end   = (ev["end_time"].replace(tzinfo=timezone.utc) if ev["end_time"] and ev["end_time"].tzinfo is None else ev["end_time"]) if ev["end_time"] else None

    non_capacity_changed = (
        body.title != ev["title"] or
        (body.description or "") != (ev["description"] or "") or
        (body.rules or "") != (ev["rules"] or "") or
        body.event_type != ev["event_type"] or
        (body_dt and body_dt != ev_dt) or
        (body_end != ev_end) or
        body.age_restriction != ev["age_restriction"] or
        (body.location_name or "") != (ev["location_name"] or "") or
        body.location_lat != ev["location_lat"] or
        body.location_lng != ev["location_lng"] or
        body.price_inr != ev["price_inr"]
    )

    if non_capacity_changed and now > ed:
        raise HTTPException(status_code=403, detail="Events can only be edited up to 7 hours before start")

    # Validate end_time duration whenever start or end changes
    new_dt  = body_dt or ev_dt
    new_end = body_end or ev_end
    if new_end:
        duration = new_end - new_dt
        if duration.total_seconds() < 3600:
            raise HTTPException(status_code=422, detail="Event must be at least 1 hour long")
        if duration.total_seconds() > 72 * 3600:
            raise HTTPException(status_code=422, detail="Events can't run longer than 3 days")

    if capacity_decreasing and ev["attendee_count"] > 0:
        raise HTTPException(status_code=400, detail="Cannot reduce capacity — attendees have already booked")

    if capacity_increasing and now > capacity_deadline:
        raise HTTPException(status_code=403, detail="Capacity cannot be changed within 2 hours of start")

    if body.price_inr != 0 and body.price_inr < MIN_TICKET_PRICE_INR:
        raise HTTPException(status_code=422, detail=f"Minimum ticket price is ₹{MIN_TICKET_PRICE_INR}")

    old_capacity = ev["capacity"]
    promoted_users = []

    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE events SET
                title=%s, description=%s, rules=%s, event_type=%s,
                date_time=%s, end_time=%s,
                capacity=%s,
                spots_left = GREATEST(0, spots_left + (%s - capacity)),
                age_restriction=%s,
                location_name=%s, location_lat=%s, location_lng=%s,
                price_inr=%s, updated_at=NOW()
            WHERE id=%s
            """,
            (
                body.title, body.description, body.rules, body.event_type,
                body.date_time, body.end_time,
                body.capacity, body.capacity,
                body.age_restriction,
                body.location_name, body.location_lat, body.location_lng,
                body.price_inr, event_id,
            ),
        )
        spots_gained = body.capacity - old_capacity
        for _ in range(max(0, spots_gained)):
            promoted = _promote_next_waitlist(cur, event_id)
            if not promoted:
                break
            promoted_users.append(promoted)
        conn.commit()

    if promoted_users:
        from routes.notifications import notify_waitlist_promoted
        with get_db() as (cur, conn):
            cur.execute("SELECT title FROM events WHERE id = %s", (event_id,))
            ev_title = (cur.fetchone() or {}).get("title", "")
            for p in promoted_users:
                notify_waitlist_promoted(cur, p["user_id"], event_id, ev_title)
            conn.commit()
        for p in promoted_users:
            background_tasks.add_task(
                send_push, p["user_id"], "A spot opened up!",
                "You have 1 hour to confirm your spot.",
                {"type": "event", "event_id": event_id},
            )

    return get_event(event_id, current_user)


# ── POST /events/{id}/rsvp ────────────────────────────────────────────────────

@router.post("/{event_id}/rsvp")
def rsvp_event(event_id: str, body: RsvpBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if body.action not in ("going", "cancel"):
        raise HTTPException(status_code=400, detail="action must be 'going' or 'cancel'")

    with get_db() as (cur, conn):
        # Lazy expiry: expire stale promotion offers before any logic
        expired_user_ids = _expire_stale_offers(cur, event_id)

        # Fetch event + user dob for age check
        cur.execute(
            "SELECT capacity, spots_left, age_restriction, date_time, end_time, title, price_inr FROM events WHERE id = %s AND is_cancelled = FALSE",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev:
            conn.commit()
            raise HTTPException(status_code=404, detail="Event not found")

        if body.action == "going":
            # Prevent RSVP after event has ended
            ev_end = ev["end_time"] if ev.get("end_time") else ev["date_time"] + timedelta(hours=6)
            if datetime.now(timezone.utc) > ev_end:
                conn.commit()
                raise HTTPException(status_code=400, detail="This event has ended")
            # Age check
            cur.execute("SELECT dob FROM users WHERE id = %s", (current_user["id"],))
            user = cur.fetchone()
            if user and user.get("dob"):
                age = _calc_age(user["dob"])
                if age < ev["age_restriction"]:
                    conn.commit()
                    raise HTTPException(
                        status_code=403,
                        detail=f"You must be {ev['age_restriction']}+ to attend this event",
                    )

            # Check if this user has an active promotion offer (promoted waitlist user confirming)
            cur.execute(
                """
                SELECT id, offer_expires_at FROM event_attendees
                WHERE event_id = %s AND user_id = %s AND status = 'waitlist'
                  AND offer_expires_at IS NOT NULL AND offer_expires_at > NOW()
                """,
                (event_id, current_user["id"]),
            )
            promoted_row = cur.fetchone()

            # Count non-promoted waitlist members — they have priority over new bookings
            cur.execute(
                """
                SELECT COUNT(*) AS cnt FROM event_attendees
                WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL
                """,
                (event_id,),
            )
            active_waitlist_count = cur.fetchone()["cnt"]

            if promoted_row:
                # Promoted user confirming — spot was already held, just flip status
                cur.execute(
                    "UPDATE event_attendees SET status = 'going', offer_expires_at = NULL WHERE id = %s",
                    (promoted_row["id"],),
                )
                status = "going"
            elif ev["spots_left"] > 0 and active_waitlist_count == 0:
                # Normal RSVP — spots available AND no one in the queue waiting
                cur.execute(
                    """
                    INSERT INTO event_attendees (event_id, user_id, status)
                    VALUES (%s, %s, 'going')
                    ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'going', offer_expires_at = NULL
                    """,
                    (event_id, current_user["id"]),
                )
                cur.execute(
                    "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s",
                    (event_id,),
                )
                status = "going"
            else:
                # Event is full — join waitlist with validation
                cur.execute(
                    "SELECT blocked_from_rejoin FROM event_attendees WHERE event_id = %s AND user_id = %s",
                    (event_id, current_user["id"]),
                )
                existing = cur.fetchone()
                if existing and existing["blocked_from_rejoin"]:
                    conn.commit()
                    raise HTTPException(status_code=403, detail="You previously ignored a spot offer and can't rejoin this waitlist")

                # Timing check: no new waitlist joins within 2h of start
                ev_dt = ev["date_time"].replace(tzinfo=timezone.utc) if ev["date_time"].tzinfo is None else ev["date_time"]
                if datetime.now(timezone.utc) > ev_dt - timedelta(hours=2):
                    conn.commit()
                    raise HTTPException(status_code=403, detail="Waitlist closed — event starts soon")

                # Waitlist cap: max 50% of capacity
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM event_attendees WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL",
                    (event_id,),
                )
                wl_count = cur.fetchone()["cnt"]
                if wl_count >= ev["capacity"] * 0.5:
                    conn.commit()
                    raise HTTPException(status_code=403, detail="Waitlist is full")

                cur.execute(
                    """
                    INSERT INTO event_attendees (event_id, user_id, status)
                    VALUES (%s, %s, 'waitlist')
                    ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'waitlist', blocked_from_rejoin = FALSE
                    """,
                    (event_id, current_user["id"]),
                )
                # Get position
                cur.execute(
                    """
                    SELECT COUNT(*) AS pos FROM event_attendees
                    WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL
                    """,
                    (event_id,),
                )
                position = cur.fetchone()["pos"]
                status = "waitlist"

            # Notify host if going
            if status == "going":
                cur.execute("SELECT host_id::text, title FROM events WHERE id = %s", (event_id,))
                ev_row = cur.fetchone()
                if ev_row:
                    cur.execute("SELECT name FROM users WHERE id = %s::uuid", (current_user["id"],))
                    attendee_row = cur.fetchone()
                    attendee_name = attendee_row["name"] if attendee_row else "Someone"
                    host_id = ev_row["host_id"]
                    uid = current_user["id"]
                    cur.execute(
                        "SELECT 1 FROM user_blocks WHERE (blocker_id=%s::uuid AND blocked_id=%s::uuid) OR (blocker_id=%s::uuid AND blocked_id=%s::uuid)",
                        (host_id, uid, uid, host_id),
                    )
                    if not cur.fetchone():
                        from routes.notifications import notify_event_rsvp
                        notify_event_rsvp(cur, host_id, uid, attendee_name, event_id, ev_row["title"])
                        background_tasks.add_task(
                            send_push, host_id, "New RSVP",
                            f"{attendee_name} is going to {ev_row['title']}",
                            {"type": "event", "event_id": event_id},
                        )

            conn.commit()

        else:  # cancel
            cur.execute(
                "SELECT status, offer_expires_at FROM event_attendees WHERE event_id = %s AND user_id = %s",
                (event_id, current_user["id"]),
            )
            existing = cur.fetchone()
            if not existing:
                conn.commit()
                raise HTTPException(status_code=404, detail="Not attending this event")

            prev_status = existing["status"]
            had_offer = existing["offer_expires_at"] is not None

            if prev_status == "going" and ev["price_inr"] > 0:
                conn.commit()
                raise HTTPException(status_code=400, detail="Tickets for paid events cannot be cancelled.")

            cur.execute(
                "UPDATE event_attendees SET status = 'cancelled', offer_expires_at = NULL WHERE event_id = %s AND user_id = %s",
                (event_id, current_user["id"]),
            )

            # Only promote if event starts > 2h from now — under 2h the freed spot becomes an empty seat
            ev_dt_cancel = ev["date_time"]
            if ev_dt_cancel and ev_dt_cancel.tzinfo is None:
                ev_dt_cancel = ev_dt_cancel.replace(tzinfo=timezone.utc)
            can_promote = ev_dt_cancel and ev_dt_cancel > datetime.now(timezone.utc) + timedelta(hours=2)

            promoted = None
            if prev_status == "going":
                cur.execute(
                    "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
                    (event_id,),
                )
                if can_promote:
                    promoted = _promote_next_waitlist(cur, event_id)
            elif prev_status == "waitlist" and had_offer:
                # Was promoted, spot was held — restore it then offer to next
                cur.execute(
                    "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
                    (event_id,),
                )
                if can_promote:
                    promoted = _promote_next_waitlist(cur, event_id)

            # Fetch for notifications
            cur.execute("SELECT host_id::text, title FROM events WHERE id = %s", (event_id,))
            ev_cancel = cur.fetchone()
            cur.execute("SELECT name FROM users WHERE id = %s::uuid", (current_user["id"],))
            attendee_cancel = cur.fetchone()
            host_id_cancel = ev_cancel["host_id"] if ev_cancel else None
            attendee_name_cancel = attendee_cancel["name"] if attendee_cancel else "Someone"
            event_title_cancel = ev_cancel["title"] if ev_cancel else ""

            conn.commit()

            if host_id_cancel and host_id_cancel != current_user["id"] and prev_status == "going":
                background_tasks.add_task(
                    send_push, host_id_cancel, "RSVP Cancelled",
                    f"{attendee_name_cancel} can't make it to {event_title_cancel}",
                    {"type": "event", "event_id": event_id},
                )
            if promoted:
                from routes.notifications import notify_waitlist_promoted
                with get_db() as (cur2, conn2):
                    notify_waitlist_promoted(cur2, promoted["user_id"], event_id, event_title_cancel)
                    conn2.commit()
                background_tasks.add_task(
                    send_push, promoted["user_id"], "A spot opened up!",
                    f"You have 1 hour to confirm your spot at {event_title_cancel}.",
                    {"type": "event", "event_id": event_id},
                )

            status = "cancelled"

        # Queue expiry push notifications (outside transaction)
        if expired_user_ids:
            from routes.notifications import notify_waitlist_expired
            with get_db() as (cur2, conn2):
                cur2.execute("SELECT title FROM events WHERE id = %s", (event_id,))
                ev_title_row = cur2.fetchone()
                ev_title = ev_title_row["title"] if ev_title_row else ""
                for uid in expired_user_ids:
                    notify_waitlist_expired(cur2, uid, event_id, ev_title)
                conn2.commit()
            for uid in expired_user_ids:
                background_tasks.add_task(
                    send_push, uid, "Spot offer expired",
                    f"Your reserved spot was given to the next person.",
                    {"type": "event", "event_id": event_id},
                )

    result = {"ok": True, "status": status}
    if status == "waitlist":
        result["position"] = position
    return result


# ── DELETE /events/{id} ───────────────────────────────────────────────────────

@router.delete("/{event_id}")
def cancel_event(event_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT host_id::text, date_time FROM events WHERE id = %s",
            (event_id,),
        )
        ev = cur.fetchone()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["host_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your event")

    cancel_deadline = ev["date_time"] - timedelta(hours=48)
    now = datetime.now(timezone.utc)
    cd = cancel_deadline.replace(tzinfo=timezone.utc) if cancel_deadline.tzinfo is None else cancel_deadline
    if now > cd:
        raise HTTPException(status_code=403, detail="Events can only be cancelled up to 48 hours before start")

    with get_db() as (cur, conn):
        cur.execute("SELECT title, price_inr FROM events WHERE id = %s", (event_id,))
        ev_title_row = cur.fetchone()
        ev_title = ev_title_row["title"] if ev_title_row else ""
        ev_price = ev_title_row["price_inr"] if ev_title_row else 0

        cur.execute("UPDATE events SET is_cancelled = TRUE WHERE id = %s", (event_id,))

        # Fetch waitlist users to notify
        cur.execute(
            "SELECT user_id::text FROM event_attendees WHERE event_id = %s AND status = 'waitlist'",
            (event_id,),
        )
        waitlist_user_ids = [r["user_id"] for r in cur.fetchall()]

        from routes.notifications import notify_waitlist_event_cancelled
        for wl_uid in waitlist_user_ids:
            notify_waitlist_event_cancelled(cur, wl_uid, event_id, ev_title)

        # Refund paid attendees to Vybe Wallet
        paid_user_ids = []
        if ev_price > 0:
            # Refund = ticket price (platform fee absorbed by VYBE on cancellation)
            refund_amount = ev_price
            cur.execute(
                """
                SELECT user_id::text FROM event_attendees
                WHERE event_id = %s AND status = 'going'
                """,
                (event_id,),
            )
            for att_row in cur.fetchall():
                att_uid = att_row["user_id"]
                paid_user_ids.append(att_uid)
                cur.execute(
                    "UPDATE users SET wallet_balance = wallet_balance + %s WHERE id = %s::uuid",
                    (refund_amount, att_uid),
                )
                cur.execute(
                    """
                    INSERT INTO wallet_transactions
                        (user_id, amount_inr, type, source, reference_id, description, expires_at)
                    VALUES (%s::uuid, %s, 'credit', 'event_refund', %s::uuid, %s, NOW() + INTERVAL '6 months')
                    """,
                    (att_uid, refund_amount, event_id, f"Refund — {ev_title}"),
                )

        conn.commit()

    for wl_uid in waitlist_user_ids:
        background_tasks.add_task(
            send_push, wl_uid, "Event cancelled",
            f"{ev_title} was cancelled. You've been removed from the waitlist.",
            {"type": "event", "event_id": event_id},
        )

    for att_uid in paid_user_ids:
        background_tasks.add_task(
            send_push, att_uid,
            "Refund in your Vybe Wallet 💰",
            f"₹{ev_price} from '{ev_title}' is now in your Vybe Wallet.",
            {"type": "wallet", "event_id": event_id},
        )

    return {"ok": True}


# ── POST /events/{id}/waitlist/admit ─────────────────────────────────────────

@router.post("/{event_id}/waitlist/admit")
def admit_from_waitlist(event_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute("SELECT host_id::text, title FROM events WHERE id = %s AND is_cancelled = FALSE", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your event")

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM event_attendees WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL",
            (event_id,),
        )
        if cur.fetchone()["cnt"] == 0:
            conn.commit()
            raise HTTPException(status_code=404, detail="No one on the waitlist")

        # Grow capacity by 1 then promote
        cur.execute(
            "UPDATE events SET capacity = capacity + 1, spots_left = spots_left + 1 WHERE id = %s",
            (event_id,),
        )
        promoted = _promote_next_waitlist(cur, event_id)

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM event_attendees WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL",
            (event_id,),
        )
        waitlist_remaining = cur.fetchone()["cnt"]

        from routes.notifications import notify_waitlist_promoted
        if promoted:
            notify_waitlist_promoted(cur, promoted["user_id"], event_id, ev["title"])

        conn.commit()

    if promoted:
        background_tasks.add_task(
            send_push, promoted["user_id"], "A spot opened up!",
            f"You have 1 hour to confirm your spot at {ev['title']}.",
            {"type": "event", "event_id": event_id},
        )

    return {
        "ok": True,
        "admitted": {"user_id": promoted["user_id"], "name": promoted["name"]} if promoted else None,
        "waitlist_remaining": waitlist_remaining,
    }


# ── GET /events/{id}/waitlist ─────────────────────────────────────────────────

@router.get("/{event_id}/waitlist")
def get_waitlist(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute("SELECT host_id::text FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the host can view the waitlist")

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                ea.joined_at::text,
                ea.offer_expires_at::text,
                ROW_NUMBER() OVER (
                    PARTITION BY ea.event_id
                    ORDER BY ea.joined_at ASC
                ) AS position,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'waitlist'
            ORDER BY ea.joined_at ASC
            """,
            (event_id,),
        )
        rows = [dict(r) for r in cur.fetchall()]
    return {"waitlist": rows, "total": len(rows)}


# ── GET /events/{id}/attendees ────────────────────────────────────────────────

@router.get("/{event_id}/attendees")
def get_attendees(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        # Only host can see attendee list
        cur.execute("SELECT host_id::text FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the host can view attendees")

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                u.city,
                ea.status,
                ea.joined_at::text,
                ea.checked_in_at::text,
                ea.ticket_token,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s
            ORDER BY ea.joined_at ASC
            """,
            (event_id,),
        )
        rows = [dict(r) for r in cur.fetchall()]
    return {"attendees": rows, "total": len(rows)}


# ── GET /events/{id}/guests ───────────────────────────────────────────────────
# Public guest list — anyone can see who's going, just name/avatar (no PII like
# check-in time or ticket tokens, unlike the host-only /attendees endpoint above).

@router.get("/{event_id}/guests")
def get_guests(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute("SELECT id FROM events WHERE id = %s", (event_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar,
                EXISTS(
                    SELECT 1 FROM follows f
                    WHERE f.follower_id = %s AND f.following_id = u.id
                ) AS is_following
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'going'
            ORDER BY ea.joined_at ASC
            LIMIT 200
            """,
            (current_user["id"], event_id),
        )
        rows = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar,
                EXISTS(
                    SELECT 1 FROM follows f
                    WHERE f.follower_id = %s AND f.following_id = u.id
                ) AS is_following
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'waitlist'
            ORDER BY ea.joined_at ASC
            LIMIT 200
            """,
            (current_user["id"], event_id),
        )
        waitlist_rows = [dict(r) for r in cur.fetchall()]
    return {"guests": rows, "total": len(rows), "waitlist": waitlist_rows}


# ── GET /events/{id}/ticket ───────────────────────────────────────────────────

@router.get("/{event_id}/ticket")
def get_my_ticket(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT ea.ticket_token, e.title AS event_title, e.date_time::text,
                   e.end_time::text, e.location_name, e.event_type,
                   u.name AS host_name
            FROM event_attendees ea
            JOIN events e ON e.id = ea.event_id
            JOIN users u ON u.id = e.host_id
            WHERE ea.event_id = %s AND ea.user_id = %s::uuid AND ea.status = 'going'
            """,
            (event_id, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No ticket found — you are not attending this event")
    return dict(row)


# ── POST /events/{id}/checkin ─────────────────────────────────────────────────

@router.post("/{event_id}/checkin")
def checkin_attendee(event_id: str, body: CheckinBody, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute("SELECT host_id::text, date_time, end_time FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the host can check in attendees")

        now = datetime.now(timezone.utc)
        checkin_open = ev["date_time"] - timedelta(hours=3)
        checkin_close = ev["end_time"] if ev["end_time"] else ev["date_time"] + timedelta(hours=6)
        if now < checkin_open:
            raise HTTPException(status_code=400, detail="Check-in opens 3 hours before the event")
        if now > checkin_close:
            raise HTTPException(status_code=400, detail="This event has ended")

        cur.execute(
            """
            SELECT ea.id, ea.checked_in_at, u.name, u.username
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.ticket_token = %s AND ea.status = 'going'
            """,
            (event_id, body.ticket_token),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invalid or cancelled ticket")

        if row["checked_in_at"] is not None:
            return {"ok": True, "already_checked_in": True, "name": row["name"], "username": row["username"]}

        method = body.method if body.method in ('qr_scan', 'manual_host') else 'qr_scan'
        cur.execute(
            "UPDATE event_attendees SET checked_in_at = NOW(), check_in_method = %s WHERE id = %s",
            (method, row["id"]),
        )
        conn.commit()
    return {"ok": True, "already_checked_in": False, "name": row["name"], "username": row["username"], "method": method}


# ── POST /events/{id}/report ──────────────────────────────────────────────────

@router.post("/{event_id}/report", status_code=201)
def report_event(event_id: str, body: ReportEventBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    allowed = {"fake_scam", "inappropriate_content", "misleading_info", "spam", "dangerous_activity", "other"}
    if body.reason not in allowed:
        raise HTTPException(status_code=400, detail="Invalid reason")
    with get_db() as (cur, conn):
        cur.execute("SELECT 1 FROM events WHERE id = %s", (event_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")
        cur.execute(
            "SELECT 1 FROM event_reports WHERE event_id = %s AND reporter_id = %s::uuid",
            (event_id, uid),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="You have already reported this event")
        cur.execute(
            "INSERT INTO event_reports (event_id, reporter_id, reason, description) VALUES (%s, %s::uuid, %s, %s)",
            (event_id, uid, body.reason, body.description),
        )
        conn.commit()
    return {"ok": True}


# ── POST /events/{id}/reviews ─────────────────────────────────────────────────

@router.post("/{event_id}/reviews")
def submit_review(event_id: str, body: ReviewBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute("SELECT date_time FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["date_time"].replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Event has not ended yet")

        cur.execute(
            "SELECT checked_in_at FROM event_attendees WHERE event_id = %s AND user_id = %s::uuid AND status = 'going'",
            (event_id, uid),
        )
        ea_row = cur.fetchone()
        if not ea_row:
            raise HTTPException(status_code=403, detail="You did not attend this event")
        if ea_row["checked_in_at"] is None:
            raise HTTPException(status_code=403, detail="You didn't check in at this event")

        cur.execute(
            "SELECT 1 FROM event_reviews WHERE event_id = %s AND reviewer_id = %s::uuid",
            (event_id, uid),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="You have already reviewed this event")

        cur.execute(
            """
            INSERT INTO event_reviews (event_id, reviewer_id, rating, body)
            VALUES (%s, %s::uuid, %s, %s)
            """,
            (event_id, uid, body.rating, body.body),
        )
        cur.execute("SELECT host_id::text, title FROM events WHERE id = %s", (event_id,))
        ev_review = cur.fetchone()
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        reviewer_row = cur.fetchone()
        host_id_review = ev_review["host_id"] if ev_review else None
        reviewer_name = reviewer_row["name"] if reviewer_row else "Someone"
        event_title_review = ev_review["title"] if ev_review else ""
        conn.commit()

    if host_id_review and host_id_review != uid:
        background_tasks.add_task(
            send_push, host_id_review, "New Review",
            f"{reviewer_name} left a {body.rating}-star review on {event_title_review}",
            {"type": "event", "event_id": event_id},
        )
    return {"ok": True}


# ── GET /events/{id}/reviews ──────────────────────────────────────────────────

@router.get("/{event_id}/reviews")
def get_reviews(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                er.id::text,
                u.name AS reviewer_name,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS reviewer_avatar,
                er.rating, er.body, er.created_at::text
            FROM event_reviews er
            JOIN users u ON u.id = er.reviewer_id
            WHERE er.event_id = %s
            ORDER BY er.created_at DESC
            """,
            (event_id,),
        )
        reviews = [dict(r) for r in cur.fetchall()]
        avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else None
    return {"avg_rating": avg, "count": len(reviews), "reviews": reviews}


# ── GET /events/{id}/reviews/me ───────────────────────────────────────────────

@router.get("/{event_id}/reviews/me")
def get_my_review(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            "SELECT rating, body FROM event_reviews WHERE event_id = %s AND reviewer_id = %s::uuid",
            (event_id, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No review found")
    return dict(row)

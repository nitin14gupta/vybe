from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/events", tags=["events"])

# ── DDL ──────────────────────────────────────────────────────────────────────

_DDL = """
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(60) NOT NULL,
    description TEXT,
    rules TEXT,
    event_type TEXT NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    capacity INT NOT NULL DEFAULT 20,
    spots_left INT NOT NULL DEFAULT 20,
    age_restriction INT NOT NULL DEFAULT 18,
    location_name TEXT,
    location_lat FLOAT,
    location_lng FLOAT,
    price_inr INT NOT NULL DEFAULT 0,
    cover_photos JSONB DEFAULT '[]'::jsonb,
    is_published BOOL DEFAULT TRUE,
    is_cancelled BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'going',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT event_attendees_unique UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS events_location_idx
    ON events(location_lat, location_lng)
    WHERE location_lat IS NOT NULL;
"""


def _ensure_tables():
    with get_db() as (cur, conn):
        cur.execute(_DDL)
        conn.commit()


def _calc_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


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


class EventDetail(EventSummary):
    description: Optional[str] = None
    rules: Optional[str] = None
    host_id: str
    is_cancelled: bool
    cancel_deadline: str
    edit_deadline: str


class CreateEventBody(BaseModel):
    title: str
    event_type: str
    description: Optional[str] = None
    rules: Optional[str] = None
    date_time: str
    end_time: Optional[str] = None
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
    min_lat: Optional[float] = Query(default=None),
    max_lat: Optional[float] = Query(default=None),
    min_lng: Optional[float] = Query(default=None),
    max_lng: Optional[float] = Query(default=None),
    limit: int = Query(default=30, le=50),
    current_user: dict = Depends(get_current_user),
):
    _ensure_tables()

    dist_sql = _haversine_sql(lat, lng) if lat and lng else "NULL::int"

    filters = ["e.is_published = TRUE", "e.is_cancelled = FALSE", "e.date_time > NOW()"]
    params: list = []

    if category:
        filters.append("e.event_type = %s")
        params.append(category)

    if is_free is True:
        filters.append("e.price_inr = 0")
    elif is_free is False:
        filters.append("e.price_inr > 0")

    if date_range == "tonight":
        filters.append("e.date_time::date = CURRENT_DATE")
    elif date_range == "weekend":
        filters.append("EXTRACT(DOW FROM e.date_time) IN (5, 6, 0)")

    # Viewport bounds take priority over radius — used by MapLibre's onRegionDidChange
    if min_lat is not None and max_lat is not None and min_lng is not None and max_lng is not None:
        filters.append("e.location_lat BETWEEN %s AND %s")
        filters.append("e.location_lng BETWEEN %s AND %s")
        params.extend([min_lat, max_lat, min_lng, max_lng])
    elif lat and lng and radius_km:
        filters.append(f"""
            6371.0 * acos(LEAST(1.0,
                cos(radians(%s)) * cos(radians(e.location_lat)) *
                cos(radians(e.location_lng) - radians(%s)) +
                sin(radians(%s)) * sin(radians(e.location_lat))
            )) <= %s
        """)
        params.extend([lat, lng, lat, radius_km])

    where = "WHERE " + " AND ".join(filters)

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
            (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count
        FROM events e
        JOIN users u ON u.id = e.host_id
        {where}
        ORDER BY {dist_sql + " ASC NULLS LAST" if lat and lng else "e.date_time ASC"}
        LIMIT %s
    """
    params.append(limit)

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


# ── GET /events/{id} ──────────────────────────────────────────────────────────

@router.get("/{event_id}", response_model=EventDetail)
def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    _ensure_tables()
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
                NULL::int AS distance_km
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE e.id = %s
            """,
            (event_id,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    d = dict(row)
    photos_raw = d.get("cover_photos") or []
    d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
    return d


# ── POST /events ──────────────────────────────────────────────────────────────

@router.post("", response_model=EventDetail, status_code=201)
def create_event(body: CreateEventBody, current_user: dict = Depends(get_current_user)):
    _ensure_tables()

    # Parse and validate date_time
    try:
        dt = datetime.fromisoformat(body.date_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date_time format")

    now = datetime.now(timezone.utc)
    if dt < now + timedelta(hours=24):
        raise HTTPException(status_code=422, detail="Events must be posted at least 24 hours in advance")

    if not (5 <= body.capacity <= 200):
        raise HTTPException(status_code=422, detail="Capacity must be between 5 and 200")

    if body.price_inr != 0 and body.price_inr < 50:
        raise HTTPException(status_code=422, detail="Minimum ticket price is ₹50")

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
        conn.commit()

    return get_event(new_id, current_user)


# ── PATCH /events/{id} ────────────────────────────────────────────────────────

@router.patch("/{event_id}", response_model=EventDetail)
def update_event(event_id: str, body: CreateEventBody, current_user: dict = Depends(get_current_user)):
    _ensure_tables()
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

    edit_deadline = ev["date_time"] - timedelta(hours=7)
    if datetime.now(timezone.utc) > edit_deadline.replace(tzinfo=timezone.utc) if edit_deadline.tzinfo is None else edit_deadline:
        raise HTTPException(status_code=403, detail="Events can only be edited up to 7 hours before start")

    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE events SET
                title=%s, description=%s, rules=%s, event_type=%s,
                date_time=%s, end_time=%s, capacity=%s, age_restriction=%s,
                location_name=%s, location_lat=%s, location_lng=%s,
                price_inr=%s, updated_at=NOW()
            WHERE id=%s
            """,
            (
                body.title, body.description, body.rules, body.event_type,
                body.date_time, body.end_time, body.capacity, body.age_restriction,
                body.location_name, body.location_lat, body.location_lng,
                body.price_inr, event_id,
            ),
        )
        conn.commit()
    return get_event(event_id, current_user)


# ── POST /events/{id}/rsvp ────────────────────────────────────────────────────

@router.post("/{event_id}/rsvp")
def rsvp_event(event_id: str, body: RsvpBody, current_user: dict = Depends(get_current_user)):
    _ensure_tables()
    if body.action not in ("going", "cancel"):
        raise HTTPException(status_code=400, detail="action must be 'going' or 'cancel'")

    with get_db() as (cur, conn):
        # Fetch event + user dob for age check
        cur.execute(
            "SELECT capacity, spots_left, age_restriction, date_time FROM events WHERE id = %s AND is_cancelled = FALSE",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")

        if body.action == "going":
            # Age check
            cur.execute("SELECT dob FROM users WHERE id = %s", (current_user["id"],))
            user = cur.fetchone()
            if user and user.get("dob"):
                age = _calc_age(user["dob"])
                if age < ev["age_restriction"]:
                    raise HTTPException(
                        status_code=403,
                        detail=f"You must be {ev['age_restriction']}+ to attend this event",
                    )

            # Check spots
            status = "going" if ev["spots_left"] > 0 else "waitlist"

            cur.execute(
                """
                INSERT INTO event_attendees (event_id, user_id, status)
                VALUES (%s, %s, %s)
                ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status
                """,
                (event_id, current_user["id"], status),
            )
            if status == "going":
                cur.execute(
                    "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s",
                    (event_id,),
                )
            conn.commit()
            return {"ok": True, "status": status}

        else:  # cancel
            cur.execute(
                "SELECT status FROM event_attendees WHERE event_id = %s AND user_id = %s",
                (event_id, current_user["id"]),
            )
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Not attending this event")

            cur.execute(
                "UPDATE event_attendees SET status = 'cancelled' WHERE event_id = %s AND user_id = %s",
                (event_id, current_user["id"]),
            )
            if existing["status"] == "going":
                cur.execute(
                    "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
                    (event_id,),
                )
            conn.commit()
            return {"ok": True, "status": "cancelled"}


# ── DELETE /events/{id} ───────────────────────────────────────────────────────

@router.delete("/{event_id}")
def cancel_event(event_id: str, current_user: dict = Depends(get_current_user)):
    _ensure_tables()
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
        cur.execute("UPDATE events SET is_cancelled = TRUE WHERE id = %s", (event_id,))
        conn.commit()

    return {"ok": True}

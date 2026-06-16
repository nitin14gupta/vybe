from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/discover", tags=["discover"])


class DiscoverPhoto(BaseModel):
    id: str
    url: str
    position: int


class DiscoverUser(BaseModel):
    id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    interests: List[str] = []
    voice_url: Optional[str] = None
    distance_km: Optional[int] = None
    match_pct: int = 0
    photos: List[DiscoverPhoto] = []


def _calc_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


@router.get("", response_model=List[DiscoverUser])
def get_discover_feed(
    limit: int = Query(default=30, le=50),
    current_user: dict = Depends(get_current_user),
):
    with get_db() as (cur, _):
        # Current user's location + interests for distance + match calculation
        cur.execute(
            "SELECT lat, lng, interests FROM users WHERE id = %s",
            (current_user["id"],),
        )
        me = cur.fetchone()
        me_lat = float(me["lat"]) if me and me.get("lat") else None
        me_lng = float(me["lng"]) if me and me.get("lng") else None
        me_interests = set(me.get("interests") or []) if me else set()

        if me_lat is not None and me_lng is not None:
            dist_sql = """
                ROUND(
                  6371.0 * acos(
                    LEAST(1.0,
                      cos(radians(%s)) * cos(radians(u.lat::float)) *
                      cos(radians(u.lng::float) - radians(%s)) +
                      sin(radians(%s)) * sin(radians(u.lat::float))
                    )
                  )
                )::int
            """
            dist_params: list = [me_lat, me_lng, me_lat]
        else:
            dist_sql = "NULL::int"
            dist_params = []

        sql = f"""
            SELECT
                u.id::text,
                u.name,
                u.dob,
                u.gender,
                u.bio,
                u.city,
                u.interests,
                u.voice_url,
                {dist_sql} AS distance_km,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id::text,
                            'url', p.url,
                            'position', p.position
                        )
                        ORDER BY p.position
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS photos
            FROM users u
            LEFT JOIN user_photos p ON p.user_id = u.id
            WHERE u.id != %s
              AND u.profile_complete = TRUE
              AND u.is_active = TRUE
            GROUP BY u.id
            ORDER BY RANDOM()
            LIMIT %s
        """

        params = dist_params + [current_user["id"], limit]
        cur.execute(sql, params)
        rows = cur.fetchall()

    result = []
    for row in rows:
        d = dict(row)
        d["interests"] = d.get("interests") or []
        d["photos"] = d.get("photos") or []

        # Age from DOB
        d["age"] = _calc_age(d["dob"]) if d.get("dob") else None
        del d["dob"]

        # Vibe match % — shared interests / max interests, base 35%
        user_interests = set(d["interests"])
        if me_interests and user_interests:
            overlap = len(me_interests & user_interests)
            total = max(len(me_interests), len(user_interests))
            d["match_pct"] = min(99, 35 + round((overlap / total) * 64))
        else:
            d["match_pct"] = 0

        result.append(d)

    return result

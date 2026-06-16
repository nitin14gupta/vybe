from fastapi import APIRouter, HTTPException, status, Depends
from datetime import date
from schemas.user import (
    ProfileCreate, ProfileUpdate, LocationUpdate, InterestsUpdate,
    UserResponse, ProfileResponse, DEFAULT_BADGES,
)
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/users", tags=["users"])

# ── SQL helper ────────────────────────────────────────────────────────────────

_USER_SELECT = """
    SELECT
        u.id::text,
        u.phone,
        u.name,
        u.gender,
        u.bio,
        u.city,
        u.interests,
        COALESCE(u.badges, ARRAY[]::text[]) AS badges,
        u.profile_complete,
        u.voice_url,
        u.lat,
        u.lng,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id)::int AS vibers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id)::int AS vibing_count,
        CASE
            WHEN %s::text = u.id::text THEN FALSE
            ELSE EXISTS(
                SELECT 1 FROM follows
                WHERE follower_id = %s::uuid AND following_id = u.id
            )
        END AS is_following,
        COALESCE(
            json_agg(
                json_build_object('id', p.id::text, 'url', p.url, 'position', p.position)
                ORDER BY p.position
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
        ) AS photos
    FROM users u
    LEFT JOIN user_photos p ON p.user_id = u.id
"""


def _fetch_user(cur, user_id: str, viewer_id: str) -> dict | None:
    cur.execute(
        _USER_SELECT + "WHERE u.id = %s GROUP BY u.id",
        (viewer_id, viewer_id, user_id),
    )
    row = cur.fetchone()
    if not row:
        return None
    d = dict(row)
    d["interests"] = d["interests"] or []
    d["badges"] = d.get("badges") or []
    d["bio"] = d.get("bio")
    d["photos"] = d.get("photos") or []
    d["vibers_count"] = d.get("vibers_count") or 0
    d["vibing_count"] = d.get("vibing_count") or 0
    d["is_following"] = bool(d.get("is_following", False))
    return d


def _age_from_dob(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


# ── Own profile ───────────────────────────────────────────────────────────────

@router.post("/profile", response_model=UserResponse)
def create_profile(body: ProfileCreate, current_user: dict = Depends(get_current_user)):
    age = _age_from_dob(body.dob)
    if age < 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be 18 or older to use Vybe",
        )
    with get_db() as (cur, _):
        cur.execute(
            """
            UPDATE users
            SET name = %s, dob = %s, gender = %s, bio = %s,
                badges = COALESCE(badges, %s::text[])
            WHERE id = %s
            """,
            (body.name, body.dob, body.gender, body.bio, DEFAULT_BADGES, current_user["id"]),
        )
        user = _fetch_user(cur, current_user["id"], current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(body: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [current_user["id"]]

    with get_db() as (cur, _):
        cur.execute(f"UPDATE users SET {set_clauses} WHERE id = %s", values)
        user = _fetch_user(cur, current_user["id"], current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)


@router.post("/interests", response_model=UserResponse)
def set_interests(body: InterestsUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "UPDATE users SET interests = %s WHERE id = %s",
            (body.interests, current_user["id"]),
        )
        user = _fetch_user(cur, current_user["id"], current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)


@router.post("/location", response_model=UserResponse)
def set_location(body: LocationUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "UPDATE users SET city = %s, lat = %s, lng = %s, profile_complete = TRUE WHERE id = %s",
            (body.city, body.lat, body.lng, current_user["id"]),
        )
        user = _fetch_user(cur, current_user["id"], current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        user = _fetch_user(cur, current_user["id"], current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)


# ── Public profile ────────────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        user = _fetch_user(cur, user_id, current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ProfileResponse(**user)


# ── Follow / Unfollow ─────────────────────────────────────────────────────────

@router.post("/{user_id}/follow", status_code=status.HTTP_200_OK)
def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    with get_db() as (cur, _):
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        cur.execute(
            """
            INSERT INTO follows (follower_id, following_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (current_user["id"], user_id),
        )
    return {"ok": True}


@router.delete("/{user_id}/follow", status_code=status.HTTP_200_OK)
def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "DELETE FROM follows WHERE follower_id = %s AND following_id = %s",
            (current_user["id"], user_id),
        )
    return {"ok": True}

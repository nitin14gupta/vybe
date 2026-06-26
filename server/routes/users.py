from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import date
from schemas.user import (
    ProfileCreate, ProfileUpdate, LocationUpdate, InterestsUpdate,
    UserResponse, ProfileResponse, DEFAULT_BADGES,
)
from middleware.auth import get_current_user
from db.config import get_db
from utils.push import send_push

router = APIRouter(prefix="/users", tags=["users"])

# ── SQL helper ────────────────────────────────────────────────────────────────

_USER_SELECT = """
    SELECT
        u.id::text,
        u.phone,
        u.name,
        u.username,
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
        EXISTS(
            SELECT 1 FROM user_blocks
            WHERE blocker_id = %s::uuid AND blocked_id = u.id
        ) AS is_blocked_by_me,
        EXISTS(
            SELECT 1 FROM user_blocks
            WHERE blocker_id = u.id AND blocked_id = %s::uuid
        ) AS is_blocked_by_them,
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
        (viewer_id, viewer_id, viewer_id, viewer_id, user_id),
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
    d["is_blocked_by_me"] = bool(d.get("is_blocked_by_me", False))
    d["is_blocked_by_them"] = bool(d.get("is_blocked_by_them", False))
    d["username"] = d.get("username")
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

    # Check username uniqueness
    if "username" in updates:
        with get_db() as (cur, _):
            cur.execute(
                "SELECT id FROM users WHERE username = %s AND id != %s::uuid",
                (updates["username"], current_user["id"]),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Username already taken")

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

@router.get("/check-username")
def check_username(username: str, current_user: dict = Depends(get_current_user)):
    import re
    clean = username.strip().lower()
    if not re.match(r'^[a-z0-9_]{3,30}$', clean):
        return {"available": False, "error": "3–30 chars: letters, numbers, underscore only"}
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id FROM users WHERE username = %s AND id != %s::uuid",
            (clean, current_user["id"]),
        )
        taken = cur.fetchone() is not None
    return {"available": not taken}


@router.get("/search")
def search_users(
    q: str = "",
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    if not q.strip():
        return {"users": [], "total": 0}
    offset = (page - 1) * limit
    viewer_id = current_user["id"]
    with get_db() as (cur, _):
        cur.execute("""
            SELECT
                u.id::text, u.name, u.username, u.gender, u.bio, u.city, u.interests, u.voice_url,
                NULL::float AS distance_km,
                0 AS match_pct,
                COALESCE(
                    json_agg(
                        json_build_object('id', p.id::text, 'url', p.url, 'position', p.position)
                        ORDER BY p.position
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS photos,
                (
                    SELECT EXTRACT(YEAR FROM age(u.dob))::int
                ) AS age,
                EXISTS(
                    SELECT 1 FROM follows
                    WHERE follower_id = %s::uuid AND following_id = u.id
                ) AS is_following,
                EXISTS(
                    SELECT 1 FROM follows
                    WHERE follower_id = u.id AND following_id = %s::uuid
                ) AS is_mutual,
                EXISTS(
                    SELECT 1 FROM conversations
                    WHERE status = 'active'
                      AND ((user1_id = %s::uuid AND user2_id = u.id)
                        OR (user1_id = u.id AND user2_id = %s::uuid))
                ) AS has_connection,
                (
                    u.city IS NOT NULL
                    AND (SELECT city FROM users WHERE id = %s::uuid) = u.city
                ) AS same_city,
                cardinality(ARRAY(
                    SELECT unnest(u.interests)
                    INTERSECT
                    SELECT unnest((SELECT interests FROM users WHERE id = %s::uuid))
                )) AS shared_interests_count
            FROM users u
            LEFT JOIN user_photos p ON p.user_id = u.id
            WHERE u.id != %s::uuid
              AND u.profile_complete = true
              AND (
                  u.username ILIKE %s
                  OR u.name ILIKE %s
                  OR u.city ILIKE %s
                  OR u.bio ILIKE %s
              )
              AND NOT EXISTS (
                  SELECT 1 FROM user_blocks
                  WHERE (blocker_id = %s::uuid AND blocked_id = u.id)
                     OR (blocker_id = u.id AND blocked_id = %s::uuid)
              )
            GROUP BY u.id
            ORDER BY
                is_following DESC,
                is_mutual DESC,
                has_connection DESC,
                same_city DESC,
                (LOWER(u.username) = LOWER(%s)) DESC,
                (LOWER(u.username) LIKE LOWER(%s)) DESC,
                (LOWER(u.name) = LOWER(%s)) DESC,
                (LOWER(u.name) LIKE LOWER(%s)) DESC,
                shared_interests_count DESC,
                u.name ASC
            LIMIT %s OFFSET %s
        """, (
            viewer_id,       # is_following
            viewer_id,       # is_mutual
            viewer_id,       # has_connection pair 1
            viewer_id,       # has_connection pair 2
            viewer_id,       # same_city
            viewer_id,       # shared_interests_count
            viewer_id,       # WHERE u.id !=
            f"{q}%",         # username ILIKE
            f"%{q}%",        # name ILIKE
            f"%{q}%",        # city ILIKE
            f"%{q}%",        # bio ILIKE
            viewer_id,       # block check 1
            viewer_id,       # block check 2
            q,               # exact username
            f"{q}%",         # username prefix
            q,               # exact name
            f"{q}%",         # name prefix
            limit,
            offset,
        ))
        rows = cur.fetchall()
        cur.execute("""
            SELECT COUNT(DISTINCT u.id) FROM users u
            WHERE u.id != %s::uuid AND u.profile_complete = true
              AND (u.username ILIKE %s OR u.name ILIKE %s OR u.city ILIKE %s OR u.bio ILIKE %s)
              AND NOT EXISTS (
                  SELECT 1 FROM user_blocks
                  WHERE (blocker_id = %s::uuid AND blocked_id = u.id)
                     OR (blocker_id = u.id AND blocked_id = %s::uuid)
              )
        """, (viewer_id, f"{q}%", f"%{q}%", f"%{q}%", f"%{q}%", viewer_id, viewer_id))
        total = cur.fetchone()["count"]
    users = []
    for row in rows:
        d = dict(row)
        d["interests"] = d.get("interests") or []
        d["photos"] = d.get("photos") or []
        users.append(d)
    return {"users": users, "total": total}


@router.get("/{user_id}/profile")
def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    viewer_id = current_user["id"]
    with get_db() as (cur, _):
        user = _fetch_user(cur, user_id, viewer_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Mutual connections: people both viewer and target are actively connected with
        cur.execute("""
            SELECT COUNT(DISTINCT partner_of_viewer) FROM (
                SELECT
                    CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END AS partner_of_viewer
                FROM conversations c
                WHERE c.status = 'active'
                  AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
                  AND CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END
                      IN (
                          SELECT CASE WHEN c2.user1_id = %s::uuid THEN c2.user2_id ELSE c2.user1_id END
                          FROM conversations c2
                          WHERE c2.status = 'active'
                            AND (c2.user1_id = %s::uuid OR c2.user2_id = %s::uuid)
                      )
            ) sub
        """, (viewer_id, viewer_id, viewer_id, viewer_id, user_id, user_id, user_id))
        mutual_count = cur.fetchone()["count"] or 0

        # Vybe status between viewer and this user
        cur.execute("""
            SELECT id::text, sender_id::text, status FROM vibe_requests
            WHERE (sender_id = %s::uuid AND receiver_id = %s::uuid)
               OR (sender_id = %s::uuid AND receiver_id = %s::uuid)
            ORDER BY created_at DESC LIMIT 1
        """, (viewer_id, user_id, user_id, viewer_id))
        vr = cur.fetchone()

        cur.execute("""
            SELECT id::text FROM conversations
            WHERE ((user1_id = %s::uuid AND user2_id = %s::uuid)
                OR (user1_id = %s::uuid AND user2_id = %s::uuid))
              AND status = 'active'
            LIMIT 1
        """, (viewer_id, user_id, user_id, viewer_id))
        conv = cur.fetchone()

        if conv:
            vybe_status = "connected"
            vybe_id = None
            vybe_sent_by_me = False
        elif vr and vr["status"] == "pending":
            vybe_status = "pending"
            vybe_id = vr["id"]
            vybe_sent_by_me = (vr["sender_id"] == viewer_id)
        else:
            vybe_status = "none"
            vybe_id = None
            vybe_sent_by_me = False

        # Events this user is attending (upcoming), cover_photos lives on the events row
        cur.execute("""
            SELECT
                e.id::text,
                e.title,
                e.event_type,
                e.date_time,
                e.price_inr         AS price,
                (e.price_inr = 0)   AS is_free,
                e.spots_left,
                COALESCE(e.cover_photos, '[]'::jsonb) AS cover_photos
            FROM event_attendees er
            JOIN events e ON e.id = er.event_id
            WHERE er.user_id = %s::uuid
              AND er.status = 'going'
              AND e.date_time >= NOW()
              AND e.is_cancelled = false
            ORDER BY e.date_time ASC
            LIMIT 6
        """, (user_id,))
        raw_events = cur.fetchall()
        events_attending = []
        for row in raw_events:
            d = dict(row)
            photos_raw = d.get("cover_photos") or []
            # cover_photos is JSONB — could be list of URL strings or list of objects
            if photos_raw and isinstance(photos_raw[0], str):
                d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)]
            events_attending.append(d)

    return {
        **user,
        "mutual_count": mutual_count,
        "vybe_status": vybe_status,
        "vybe_id": vybe_id,
        "vybe_sent_by_me": vybe_sent_by_me,
        "conversation_id": conv["id"] if conv else None,
        "events_attending": events_attending,
    }


@router.get("/blocked")
def get_blocked_users(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT u.id::text, u.name, u.city, ub.created_at,
                   (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar
            FROM user_blocks ub
            JOIN users u ON u.id = ub.blocked_id
            WHERE ub.blocker_id = %s::uuid
            ORDER BY ub.created_at DESC
            """,
            (current_user["id"],),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        user = _fetch_user(cur, user_id, current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ProfileResponse(**user)


# ── Followers / Following lists ───────────────────────────────────────────────

def _follow_rows(cur, join_col: str, filter_col: str, viewer_id: str, target_id: str, limit: int, offset: int, include_follows_back: bool = False):
    follows_back_col = ""
    if include_follows_back:
        # For following list: does this person also follow the profile owner (target_id)?
        follows_back_col = f"""
        ,EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = u.id AND following_id = '{target_id}'::uuid
        ) AS follows_back"""

    sql = f"""
    SELECT
        u.id::text,
        u.name,
        u.username,
        u.city,
        (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar_url,
        EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = %s::uuid AND following_id = u.id
        ) AS is_following
        {follows_back_col},
        COUNT(*) OVER() AS total_count
    FROM follows f
    JOIN users u ON u.id = {join_col}
    WHERE {filter_col} = %s::uuid
    ORDER BY f.created_at DESC
    LIMIT %s OFFSET %s
    """
    cur.execute(sql, (viewer_id, target_id, limit, offset))
    rows = cur.fetchall()
    total = int(rows[0]["total_count"]) if rows else 0
    users = [
        {
            "id": r["id"],
            "name": r["name"],
            "username": r["username"],
            "city": r["city"],
            "avatar_url": r["avatar_url"],
            "is_following": bool(r["is_following"]),
            "follows_back": bool(r["follows_back"]) if include_follows_back else False,
            "is_me": r["id"] == viewer_id,
        }
        for r in rows
    ]
    return {"users": users, "total": total, "has_more": offset + len(users) < total}


@router.get("/{user_id}/followers")
def get_followers(user_id: str, limit: int = 20, offset: int = 0, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        return _follow_rows(cur, "f.follower_id", "f.following_id", current_user["id"], user_id, limit, offset)


@router.get("/{user_id}/following")
def get_following(user_id: str, limit: int = 20, offset: int = 0, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        return _follow_rows(cur, "f.following_id", "f.follower_id", current_user["id"], user_id, limit, offset, include_follows_back=True)


@router.delete("/followers/{follower_id}", status_code=status.HTTP_200_OK)
def remove_follower(follower_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "DELETE FROM follows WHERE follower_id = %s::uuid AND following_id = %s::uuid",
            (follower_id, current_user["id"]),
        )
    return {"ok": True}


# ── Follow / Unfollow ─────────────────────────────────────────────────────────

@router.post("/{user_id}/follow", status_code=status.HTTP_200_OK)
def follow_user(user_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
        cur.execute("SELECT name FROM users WHERE id = %s", (current_user["id"],))
        follower_row = cur.fetchone()
        follower_name = follower_row["name"] if follower_row else "Someone"
        cur.execute(
            "SELECT url FROM user_photos WHERE user_id = %s::uuid ORDER BY position LIMIT 1",
            (current_user["id"],),
        )
        follower_photo = cur.fetchone()
        follower_avatar = follower_photo["url"] if follower_photo else None

    background_tasks.add_task(
        send_push, user_id, "New Follower",
        f"{follower_name} started following you",
        {"type": "profile", "user_id": current_user["id"]},
        follower_avatar,
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


# ── Block / Unblock ───────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    reason: str


@router.post("/{user_id}/block", status_code=status.HTTP_200_OK)
def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    with get_db() as (cur, conn):
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        cur.execute(
            """
            INSERT INTO user_blocks (blocker_id, blocked_id)
            VALUES (%s::uuid, %s::uuid)
            ON CONFLICT DO NOTHING
            """,
            (current_user["id"], user_id),
        )
        conn.commit()
    return {"ok": True}


@router.delete("/{user_id}/block", status_code=status.HTTP_200_OK)
def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            "DELETE FROM user_blocks WHERE blocker_id = %s::uuid AND blocked_id = %s::uuid",
            (current_user["id"], user_id),
        )
        conn.commit()
    return {"ok": True}


# ── Report ────────────────────────────────────────────────────────────────────

@router.post("/{user_id}/report", status_code=status.HTTP_200_OK)
def report_user(user_id: str, body: ReportRequest, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO user_reports (reporter_id, reported_id, reason)
            VALUES (%s::uuid, %s::uuid, %s)
            """,
            (current_user["id"], user_id, body.reason),
        )
        conn.commit()
    return {"ok": True}

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import date
from schemas.user import ProfileCreate, ProfileUpdate, LocationUpdate, InterestsUpdate, UserResponse
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/users", tags=["users"])


def _age_from_dob(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


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
            SET name = %s, dob = %s, gender = %s
            WHERE id = %s
            RETURNING id, phone, name, gender, city, interests, profile_complete, voice_url
            """,
            (body.name, body.dob, body.gender, current_user["id"]),
        )
        user = cur.fetchone()

    return UserResponse(**{**dict(user), "id": str(user["id"]), "interests": user["interests"] or []})


@router.patch("/profile", response_model=UserResponse)
def update_profile(body: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [current_user["id"]]

    with get_db() as (cur, _):
        cur.execute(
            f"UPDATE users SET {set_clauses} WHERE id = %s RETURNING id, phone, name, gender, city, interests, profile_complete, voice_url",
            values,
        )
        user = cur.fetchone()

    return UserResponse(**{**dict(user), "id": str(user["id"]), "interests": user["interests"] or []})


@router.post("/interests", response_model=UserResponse)
def set_interests(body: InterestsUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "UPDATE users SET interests = %s WHERE id = %s RETURNING id, phone, name, gender, city, interests, profile_complete, voice_url",
            (body.interests, current_user["id"]),
        )
        user = cur.fetchone()
    return UserResponse(**{**dict(user), "id": str(user["id"]), "interests": user["interests"] or []})


@router.post("/location", response_model=UserResponse)
def set_location(body: LocationUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "UPDATE users SET city = %s, lat = %s, lng = %s, profile_complete = TRUE WHERE id = %s RETURNING id, phone, name, gender, city, interests, profile_complete, voice_url",
            (body.city, body.lat, body.lng, current_user["id"]),
        )
        user = cur.fetchone()
    return UserResponse(**{**dict(user), "id": str(user["id"]), "interests": user["interests"] or []})


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id, phone, name, gender, city, interests, profile_complete, voice_url FROM users WHERE id = %s",
            (current_user["id"],),
        )
        user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**{**dict(user), "id": str(user["id"]), "interests": user["interests"] or []})

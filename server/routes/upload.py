import io
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from middleware.auth import get_current_user
from utils.r2_client import r2_client
from db.config import get_db

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png"}
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VOICE_SIZE = 5 * 1024 * 1024   # 5 MB


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    position: int = Form(0),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed")

    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo must be under 10 MB")

    result = r2_client.upload_file(
        io.BytesIO(contents),
        file.filename or f"photo_{position}.jpg",
        folder=f"users/{current_user['id']}/photos",
    )

    with get_db() as (cur, _):
        cur.execute(
            """
            INSERT INTO user_photos (user_id, url, r2_path, position)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id, url, position
            """,
            (current_user["id"], result["url"], result["path"], position),
        )
        photo = cur.fetchone()

    return {"url": result["url"], "position": position, "id": str(photo["id"]) if photo else None}


@router.post("/voice")
async def upload_voice(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    allowed_audio = {"audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/aac", "audio/m4a"}
    if file.content_type not in allowed_audio:
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    contents = await file.read()
    if len(contents) > MAX_VOICE_SIZE:
        raise HTTPException(status_code=400, detail="Voice intro must be under 5 MB")

    result = r2_client.upload_file(
        io.BytesIO(contents),
        file.filename or "voice.m4a",
        folder=f"users/{current_user['id']}/voice",
    )

    with get_db() as (cur, _):
        cur.execute(
            "UPDATE users SET voice_url = %s, voice_r2_path = %s WHERE id = %s",
            (result["url"], result["path"], current_user["id"]),
        )

    return {"url": result["url"]}


@router.delete("/photo/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(photo_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "SELECT r2_path FROM user_photos WHERE id = %s AND user_id = %s",
            (photo_id, current_user["id"]),
        )
        photo = cur.fetchone()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    r2_client.delete_file(photo["r2_path"])

    with get_db() as (cur, _):
        cur.execute("DELETE FROM user_photos WHERE id = %s", (photo_id,))

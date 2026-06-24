import io
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from pydantic import BaseModel
from middleware.auth import get_current_user
from utils.r2_client import r2_client
from utils.face_detect import has_face
from db.config import get_db

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    # React Native / Android sometimes sends these
    "application/octet-stream",
}
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VOICE_SIZE = 5 * 1024 * 1024   # 5 MB


def _is_image(file: UploadFile) -> bool:
    ct = (file.content_type or "").lower()
    name = (file.filename or "").lower()
    if ct in ALLOWED_IMAGE_TYPES:
        return True
    # fallback: check extension when content_type is generic
    return any(name.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp"))


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    position: int = Form(0),
    current_user: dict = Depends(get_current_user),
):
    print(f"\n[UPLOAD] photo — user={current_user['id']} pos={position} "
          f"content_type={file.content_type!r} filename={file.filename!r}", flush=True)

    if not _is_image(file):
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    contents = await file.read()
    print(f"[UPLOAD] read {len(contents)} bytes", flush=True)

    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo must be under 10 MB")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")

    if not has_face(contents):
        raise HTTPException(
            status_code=400,
            detail="Please upload a photo with your face visible so people can find you!",
        )

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or f"photo_{position}.jpg",
            folder=f"users/{current_user['id']}/photos",
        )
        print(f"[UPLOAD] R2 success → {result['url']}", flush=True)
    except Exception as e:
        print(f"[UPLOAD] R2 error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    with get_db() as (cur, _):
        cur.execute(
            """
            INSERT INTO user_photos (user_id, url, r2_path, position)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, position) DO UPDATE
              SET url = EXCLUDED.url, r2_path = EXCLUDED.r2_path
            RETURNING id, url, position
            """,
            (current_user["id"], result["url"], result["path"], position),
        )
        photo = cur.fetchone()

    return {"url": result["url"], "position": position, "id": str(photo["id"]) if photo else None}


@router.post("/event-photo")
async def upload_event_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload an event cover photo. No face validation — posters are fine."""
    print(f"\n[UPLOAD] event-photo — user={current_user['id']} "
          f"content_type={file.content_type!r} filename={file.filename!r}", flush=True)

    if not _is_image(file):
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo must be under 10 MB")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or "cover.jpg",
            folder=f"events/{current_user['id']}/covers",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    return {"url": result["url"]}


@router.post("/voice")
async def upload_voice(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    print(f"\n[UPLOAD] voice — user={current_user['id']} "
          f"content_type={file.content_type!r} filename={file.filename!r}", flush=True)

    contents = await file.read()
    print(f"[UPLOAD] voice read {len(contents)} bytes", flush=True)

    if len(contents) > MAX_VOICE_SIZE:
        raise HTTPException(status_code=400, detail="Voice intro must be under 5 MB")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received")

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or "voice.m4a",
            folder=f"users/{current_user['id']}/voice",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    with get_db() as (cur, _):
        cur.execute(
            "UPDATE users SET voice_url = %s, voice_r2_path = %s WHERE id = %s",
            (result["url"], result["path"], current_user["id"]),
        )

    return {"url": result["url"]}


@router.post("/chat-voice")
async def upload_chat_voice(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    contents = await file.read()

    if len(contents) > MAX_VOICE_SIZE:
        raise HTTPException(status_code=400, detail="Voice message must be under 5 MB")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received")

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or "voice.m4a",
            folder="chat/voice",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    return {"url": result["url"]}


MAX_MEDIA_SIZE = 50 * 1024 * 1024  # 50 MB (videos)

ALLOWED_MEDIA_CONTENT_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/quicktime", "video/x-m4v", "video/3gpp",
    "application/octet-stream",
}


@router.post("/chat-media")
async def upload_chat_media(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ct = (file.content_type or "").lower()
    name = (file.filename or "").lower()
    is_video = ct.startswith("video/") or any(name.endswith(e) for e in (".mp4", ".mov", ".m4v", ".3gp"))
    is_gif = ct == "image/gif" or name.endswith(".gif")

    max_size = MAX_MEDIA_SIZE if is_video else MAX_PHOTO_SIZE
    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or ("video.mp4" if is_video else "image.jpg"),
            folder="chat/media",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    media_type = "video" if is_video else ("gif" if is_gif else "image")
    return {"url": result["url"], "media_type": media_type}


class SwapRequest(BaseModel):
    position_a: int
    position_b: int


@router.post("/photo/swap")
def swap_photo_positions(
    body: SwapRequest,
    current_user: dict = Depends(get_current_user),
):
    a, b = body.position_a, body.position_b
    user_id = current_user["id"]
    print(f"[UPLOAD] swap positions {a}↔{b} for user {user_id}", flush=True)

    with get_db() as (cur, _):
        # Two-step swap to avoid unique constraint violation:
        # 1. shift both to temp positions beyond valid range (add 100)
        cur.execute(
            "UPDATE user_photos SET position = position + 100 WHERE user_id = %s AND position IN (%s, %s)",
            (user_id, a, b),
        )
        # 2. move to their swapped final positions
        cur.execute(
            """
            UPDATE user_photos SET position = CASE
                WHEN position = %s THEN %s
                WHEN position = %s THEN %s
            END
            WHERE user_id = %s AND position IN (%s, %s)
            """,
            (a + 100, b, b + 100, a, user_id, a + 100, b + 100),
        )
    return {"ok": True}


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

    try:
        r2_client.delete_file(photo["r2_path"])
    except Exception as e:
        print(f"[UPLOAD] R2 delete error: {e}", flush=True)

    with get_db() as (cur, _):
        cur.execute("DELETE FROM user_photos WHERE id = %s", (photo_id,))

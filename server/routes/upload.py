import io
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from pydantic import BaseModel
from middleware.auth import get_current_user
from utils.r2_client import r2_client
from utils.face_detect import has_face
from utils.image_utils import convert_to_webp, ImageConversionError
from db.config import get_db

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif",
    # React Native / Android sometimes sends these
    "application/octet-stream",
}
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB — enforced on the converted WebP output
MAX_VOICE_SIZE = 5 * 1024 * 1024   # 5 MB
# Raw upload ceiling read from the wire before any processing — generous
# headroom above MAX_PHOTO_SIZE since an unconverted phone-camera JPEG/HEIC
# is much larger than its final WebP output. Just a DoS backstop so a client
# can't force the server to buffer an unbounded body into memory.
RAW_IMAGE_UPLOAD_CAP = 25 * 1024 * 1024


async def _read_capped(file: UploadFile, max_size: int, too_large_detail: str) -> bytes:
    """Reads `file` in chunks, rejecting as soon as `max_size` is exceeded —
    avoids buffering an unbounded body into memory before the size check."""
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_size:
            raise HTTPException(status_code=400, detail=too_large_detail)
        chunks.append(chunk)
    return b"".join(chunks)


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

    raw = await _read_capped(file, RAW_IMAGE_UPLOAD_CAP, "Photo is too large")
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")
    try:
        contents = convert_to_webp(raw, force_square=True)
    except ImageConversionError as e:
        raise HTTPException(status_code=400, detail="Could not process this image — is it a valid photo?") from e
    print(f"[UPLOAD] read {len(contents)} bytes (converted to webp)", flush=True)

    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo must be under 10 MB")

    if position == 0 and not has_face(contents):
        raise HTTPException(
            status_code=400,
            detail="Please upload a photo with your face visible so people can find you!",
        )

    try:
        filename = (file.filename or f"photo_{position}").rsplit(".", 1)[0] + ".webp"
        result = r2_client.upload_file(
            io.BytesIO(contents),
            filename,
            folder=f"users/{current_user['id']}/photos",
        )
        print(f"[UPLOAD] R2 success → {result['url']}", flush=True)
    except Exception as e:
        print(f"[UPLOAD] R2 error: {e!r}", flush=True)
        raise HTTPException(status_code=500, detail="Storage upload failed, please try again")

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
    """Upload an event cover/gallery photo. No face validation — posters are fine.
    Always center-cropped to 16:9 server-side — a safety net in case the client
    skipped the in-app cropper, so every stored photo ends up the right shape."""
    print(f"\n[UPLOAD] event-photo — user={current_user['id']} "
          f"content_type={file.content_type!r} filename={file.filename!r}", flush=True)

    if not _is_image(file):
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    raw = await _read_capped(file, RAW_IMAGE_UPLOAD_CAP, "Photo is too large")
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")
    try:
        contents = convert_to_webp(raw, aspect_ratio=16 / 9)
    except ImageConversionError as e:
        raise HTTPException(status_code=400, detail="Could not process this image — is it a valid photo?") from e
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo must be under 10 MB")

    try:
        filename = (file.filename or "cover").rsplit(".", 1)[0] + ".webp"
        result = r2_client.upload_file(
            io.BytesIO(contents),
            filename,
            folder=f"events/{current_user['id']}/covers",
        )
    except Exception as e:
        print(f"[UPLOAD] R2 error: {e!r}", flush=True)
        raise HTTPException(status_code=500, detail="Storage upload failed, please try again")

    return {"url": result["url"]}


@router.post("/voice")
async def upload_voice(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    print(f"\n[UPLOAD] voice — user={current_user['id']} "
          f"content_type={file.content_type!r} filename={file.filename!r}", flush=True)

    contents = await _read_capped(file, MAX_VOICE_SIZE, "Voice intro must be under 5 MB")
    print(f"[UPLOAD] voice read {len(contents)} bytes", flush=True)

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received")

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or "voice.m4a",
            folder=f"users/{current_user['id']}/voice",
        )
    except Exception as e:
        print(f"[UPLOAD] R2 error: {e!r}", flush=True)
        raise HTTPException(status_code=500, detail="Storage upload failed, please try again")

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
    contents = await _read_capped(file, MAX_VOICE_SIZE, "Voice message must be under 5 MB")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received")

    try:
        result = r2_client.upload_file(
            io.BytesIO(contents),
            file.filename or "voice.m4a",
            folder="chat/voice",
        )
    except Exception as e:
        print(f"[UPLOAD] R2 error: {e!r}", flush=True)
        raise HTTPException(status_code=500, detail="Storage upload failed, please try again")

    return {"url": result["url"]}


MAX_MEDIA_SIZE = 50 * 1024 * 1024  # 50 MB (videos)
CHAT_IMAGE_MAX_DIMENSION = 1600  # px, longest edge — chat bubbles/thumbnails never need more

ALLOWED_MEDIA_CONTENT_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
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
    raw_cap = MAX_MEDIA_SIZE if is_video else (MAX_PHOTO_SIZE if is_gif else RAW_IMAGE_UPLOAD_CAP)
    contents = await _read_capped(file, raw_cap, "File too large")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")

    if not is_video and not is_gif:
        try:
            contents = convert_to_webp(contents, max_dimension=CHAT_IMAGE_MAX_DIMENSION)
        except ImageConversionError as e:
            raise HTTPException(status_code=400, detail="Could not process this image — is it a valid photo?") from e

    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        if is_video:
            filename = file.filename or "video.mp4"
        elif is_gif:
            filename = file.filename or "image.gif"
        else:
            filename = (file.filename or "image").rsplit(".", 1)[0] + ".webp"

        result = r2_client.upload_file(
            io.BytesIO(contents),
            filename,
            folder="chat/media",
        )
    except Exception as e:
        print(f"[UPLOAD] R2 error: {e!r}", flush=True)
        raise HTTPException(status_code=500, detail="Storage upload failed, please try again")

    media_type = "video" if is_video else ("gif" if is_gif else "image")
    return {"url": result["url"], "media_type": media_type}


class ReorderItem(BaseModel):
    id: str
    position: int

class ReorderRequest(BaseModel):
    updates: list[ReorderItem]

@router.post("/photo/reorder")
def reorder_photos(
    body: ReorderRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    with get_db() as (cur, conn):
        # Temp shift to avoid unique constraint conflicts
        for item in body.updates:
            cur.execute(
                "UPDATE user_photos SET position = position + 100 WHERE id = %s AND user_id = %s",
                (item.id, user_id),
            )
        # Apply new positions
        for item in body.updates:
            cur.execute(
                "UPDATE user_photos SET position = %s WHERE id = %s AND user_id = %s",
                (item.position, item.id, user_id),
            )
        conn.commit()
    return {"ok": True}

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

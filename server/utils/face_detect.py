try:
    import cv2
    import numpy as np
    _available = True
    _cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    print("[face_detect] opencv loaded — face validation active", flush=True)
except Exception as e:
    _available = False
    print(f"[face_detect] opencv unavailable — face validation skipped: {e!r}", flush=True)


def has_face(image_bytes: bytes) -> bool:
    """True if a human face is detected. Falls back to True if opencv unavailable."""
    if not _available:
        return True
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return True
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # lenient params: catches selfies, group shots, side profiles
        faces = _cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40)
        )
        return len(faces) > 0
    except Exception as e:
        print(f"[face_detect] error during detection: {e}", flush=True)
        return True  # never block uploads on detector failure

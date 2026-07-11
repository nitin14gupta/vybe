import io
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

def convert_to_webp(
    contents: bytes,
    quality: int = 85,
    force_square: bool = False,
    aspect_ratio: float | None = None,
) -> bytes:
    """
    Converts an image byte string to WebP format.
    Supports JPEG, PNG, WEBP, and HEIC.

    - force_square: legacy alias for aspect_ratio=1.0 (profile photos).
    - aspect_ratio (width/height): if the source doesn't already match this
      ratio, center-crop it to fit — e.g. 16/9 for event cover photos. This
      is a safety net for clients that skip the in-app cropper; it always
      runs server-side so every stored image ends up the correct shape.
    """
    try:
        with Image.open(io.BytesIO(contents)) as img:
            # Convert to RGB if necessary (e.g., RGBA or P)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            target_ratio = 1.0 if force_square else aspect_ratio
            if target_ratio:
                w, h = img.size
                current_ratio = w / h
                if abs(current_ratio - target_ratio) > 0.01:
                    if current_ratio > target_ratio:
                        # Source is too wide relative to target — crop the sides.
                        new_w = round(h * target_ratio)
                        left = (w - new_w) // 2
                        img = img.crop((left, 0, left + new_w, h))
                    else:
                        # Source is too tall relative to target — crop top/bottom.
                        new_h = round(w / target_ratio)
                        top = (h - new_h) // 2
                        img = img.crop((0, top, w, top + new_h))

            output = io.BytesIO()
            img.save(output, format="WEBP", quality=quality)
            return output.getvalue()
    except Exception as e:
        print(f"[IMAGE_UTILS] Failed to convert image to WebP: {e}")
        # If conversion fails, return the original contents
        return contents

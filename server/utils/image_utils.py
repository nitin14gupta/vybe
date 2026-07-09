import io
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

def convert_to_webp(contents: bytes, quality: int = 85, force_square: bool = False) -> bytes:
    """
    Converts an image byte string to WebP format.
    Supports JPEG, PNG, WEBP, and HEIC.
    If force_square is True, automatically crops the image from the center to a 1:1 ratio.
    """
    try:
        with Image.open(io.BytesIO(contents)) as img:
            # Convert to RGB if necessary (e.g., RGBA or P)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            if force_square:
                w, h = img.size
                if w != h:
                    size = min(w, h)
                    left = (w - size) // 2
                    top = (h - size) // 2
                    img = img.crop((left, top, left + size, top + size))
            
            output = io.BytesIO()
            img.save(output, format="WEBP", quality=quality)
            return output.getvalue()
    except Exception as e:
        print(f"[IMAGE_UTILS] Failed to convert image to WebP: {e}")
        # If conversion fails, return the original contents
        return contents

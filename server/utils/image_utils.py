import io
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()


class ImageConversionError(Exception):
    """Raised when `contents` can't be decoded as a real image — covers
    corrupt files, non-image content masquerading as an image (spoofed
    content-type/extension), and oversized images (Pillow's built-in
    Image.MAX_IMAGE_PIXELS decompression-bomb guard raises through here too).
    Callers must reject the upload on this, not fall back to the raw bytes."""


def convert_to_webp(
    contents: bytes,
    quality: int = 85,
    force_square: bool = False,
    aspect_ratio: float | None = None,
    max_dimension: int | None = None,
) -> bytes:
    """
    Converts an image byte string to WebP format.
    Supports JPEG, PNG, WEBP, and HEIC.

    - force_square: legacy alias for aspect_ratio=1.0 (profile photos).
    - aspect_ratio (width/height): if the source doesn't already match this
      ratio, center-crop it to fit — e.g. 16/9 for event cover photos. This
      is a safety net for clients that skip the in-app cropper; it always
      runs server-side so every stored image ends up the correct shape.
    - max_dimension: if set, downscales so the longest edge is at most this
      many pixels (aspect ratio preserved, never upscales). Applied after
      cropping. Modern phone cameras shoot 12-48MP — without this, full-res
      originals get stored and served as-is, inflating storage/bandwidth and
      slowing first paint for no visible quality gain in a chat bubble/thumbnail.
    """
    try:
        with Image.open(io.BytesIO(contents)) as img:
            img.load()  # forces full decode now (Image.open only reads the header
                        # lazily) — this is where a spoofed/corrupt/bomb file fails.
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

            if max_dimension:
                w, h = img.size
                longest = max(w, h)
                if longest > max_dimension:
                    scale = max_dimension / longest
                    img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

            output = io.BytesIO()
            img.save(output, format="WEBP", quality=quality)
            return output.getvalue()
    except Exception as e:
        raise ImageConversionError(f"Could not process image: {e}") from e

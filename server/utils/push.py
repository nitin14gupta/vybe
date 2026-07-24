import logging
import httpx
from db.config import get_db

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# Push notification categories a user can toggle off in Settings — see
# routes/notifications.py's preferences endpoints and client
# (settings)/notification-preferences.tsx. `category=None` (account
# security notices, report confirmations) is never gated — always sent.
NOTIF_CATEGORIES = ("social", "hosting", "attending", "payments")


def _category_enabled(user_id: str, category: str) -> bool:
    """A missing/absent key in notification_prefs means the category is on
    (default-on) — only an explicit `false` turns it off."""
    try:
        with get_db() as (cur, _):
            cur.execute("SELECT notification_prefs FROM users WHERE id = %s::uuid", (user_id,))
            row = cur.fetchone()
        prefs = (row["notification_prefs"] if row else None) or {}
        return prefs.get(category, True) is not False
    except Exception:
        return True


def get_event_image_url(event_id: str):
    """Fetches an event's first cover photo for use as a push notification image."""
    try:
        with get_db() as (cur, _):
            cur.execute("SELECT cover_photos FROM events WHERE id = %s", (event_id,))
            row = cur.fetchone()
        photos = row["cover_photos"] if row else None
        if not photos:
            return None
        first = photos[0]
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            return first.get("url")
        return None
    except Exception:
        return None


def send_push(user_id: str, title: str, body: str, data: dict = None, image_url: str = None, category: str = None):
    try:
        if category is not None and not _category_enabled(user_id, category):
            return

        with get_db() as (cur, _):
            cur.execute(
                "SELECT expo_token FROM device_tokens WHERE user_id = %s::uuid",
                (user_id,),
            )
            tokens = [r["expo_token"] for r in cur.fetchall()]

        if not tokens:
            return

        base = {
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
            "priority": "high",
        }
        if image_url:
            base["richContent"] = {"image": image_url}
            base["mutableContent"] = True

        messages = [{**base, "to": t} for t in tokens]

        resp = httpx.post(EXPO_PUSH_URL, json=messages, timeout=5)
        results = resp.json().get("data", [])

        stale = [
            messages[i]["to"]
            for i, r in enumerate(results)
            if isinstance(r, dict) and r.get("details", {}).get("error") == "DeviceNotRegistered"
        ]
        if stale:
            with get_db() as (cur, conn):
                cur.execute(
                    "DELETE FROM device_tokens WHERE expo_token = ANY(%s)",
                    (stale,),
                )
                conn.commit()

    except Exception as e:
        logging.warning(f"push failed for user {user_id}: {e}")

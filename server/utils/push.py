import logging
import httpx
from db.config import get_db

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push(user_id: str, title: str, body: str, data: dict = None, image_url: str = None):
    try:
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
            # Works natively on Android; iOS needs a notification service extension
            base["richContent"] = {"image": image_url}

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

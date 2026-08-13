"""
One-off local-dev seed script — adds 5 MORE unread in-app notifications for
the same target user as seed_chat_for_user.py, WITHOUT touching chat/events
data (reuses the buddy users and hosted events that script already created;
run that one first).

Additive, not idempotent by design: run it again and you get 5 more on top
of whatever's already there — useful for testing the header's pop badge and
list scrolling with a growing backlog, without resetting read state.

Run with:  server/venv/Scripts/python.exe server/scripts/seed_notifications_for_user.py
"""
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.config import get_db  # noqa: E402

TARGET_USER_ID = "6e0db5a8-2836-40d4-b9cb-8c0a66146bf2"
BUDDY_PHONE_PREFIX = "93000000"  # matches seed_chat_for_user.py


def main():
    with get_db() as (cur, conn):
        cur.execute("SELECT id, name FROM users WHERE id = %s", (TARGET_USER_ID,))
        target = cur.fetchone()
        if not target:
            print(f"No user found with id {TARGET_USER_ID} — aborting.")
            return
        print(f"Target user: {target['name']} ({TARGET_USER_ID})")

        cur.execute("SELECT id::text, name FROM users WHERE phone LIKE %s", (BUDDY_PHONE_PREFIX + "%",))
        buddies = cur.fetchall()
        if len(buddies) < 5:
            print(f"Only {len(buddies)} buddy users found (need 5) — run seed_chat_for_user.py first.")
            return
        actors = random.sample(buddies, k=5)

        cur.execute("SELECT id::text, title FROM events WHERE host_id = %s ORDER BY created_at DESC LIMIT 5", (TARGET_USER_ID,))
        events = cur.fetchall()
        if not events:
            print("No events found for target — run seed_chat_for_user.py first.")
            return

        now = datetime.now(timezone.utc)

        notif_rows = [
            (
                "host_badge_earned", target["id"], target["id"], "user",
                "You're a Rising Host now! \U0001f31f",
                "Keep it up — more hosted events means more visibility for your next one.",
            ),
            (
                "waitlist_promoted", actors[0]["id"], events[0]["id"], "event",
                "A spot opened up!",
                f"You have 1 hour to confirm your spot at {events[0]['title']}.",
            ),
            (
                "checked_in", actors[1]["id"], events[min(1, len(events) - 1)]["id"], "event",
                "You're checked in! \U0001f389",
                f"Enjoy {events[min(1, len(events) - 1)]['title']}.",
            ),
            (
                "follow_rsvp", actors[2]["id"], events[min(2, len(events) - 1)]["id"], "event",
                f"{actors[2]['name']} is going to {events[min(2, len(events) - 1)]['title']}",
                "Someone you follow just RSVPed — check it out.",
            ),
            (
                "payment_confirmed", actors[3]["id"], events[min(3, len(events) - 1)]["id"], "event",
                "Payment confirmed!",
                f"Your ticket for {events[min(3, len(events) - 1)]['title']} is ready.",
            ),
        ]

        for i, (ntype, actor_id, entity_id, entity_type, title, body) in enumerate(notif_rows):
            cur.execute(
                """
                INSERT INTO notifications (user_id, type, actor_id, entity_id, entity_type, title, body, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (TARGET_USER_ID, ntype, actor_id, entity_id, entity_type, title, body,
                 now - timedelta(minutes=random.randint(1, 30) + i)),
            )
        print(f"Added {len(notif_rows)} more unread in-app notifications for target")

        conn.commit()
    print("Done — seed committed.")


if __name__ == "__main__":
    main()

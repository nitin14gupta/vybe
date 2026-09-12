from db.config import get_db
from utils.push import send_push, get_event_image_url

GRACE_MINUTES = 30


def send_event_wrapup_notifications() -> dict:
    """Runs periodically (see _event_wrapup_loop in main.py) once an event's
    end has passed: nudges checked-in attendees who haven't reviewed yet,
    and separately consoles attendees who RSVP'd 'going' but never checked
    in. Each attendee row is only ever notified once per kind —
    review_prompt_sent_at / missed_event_notice_sent_at gate re-sends across
    ticks and restarts, so this is safe to call on a plain interval."""
    return {
        "review_prompts": _send_review_prompts(),
        "missed_notices": _send_missed_notices(),
    }


def _send_review_prompts() -> int:
    from routes.notifications import notify_event_review_prompt

    with get_db() as (cur, conn):
        cur.execute(
            f"""
            SELECT ea.id::text AS row_id, ea.user_id::text, e.id::text AS event_id, e.title
            FROM event_attendees ea
            JOIN events e ON e.id = ea.event_id
            WHERE ea.status = 'going'
              AND ea.checked_in_at IS NOT NULL
              AND ea.review_prompt_sent_at IS NULL
              AND e.is_cancelled = FALSE
              AND COALESCE(e.end_time, e.date_time) < NOW() - INTERVAL '{GRACE_MINUTES} minutes'
              AND NOT EXISTS (
                  SELECT 1 FROM event_reviews er
                  WHERE er.event_id = e.id AND er.reviewer_id = ea.user_id
              )
            """
        )
        rows = cur.fetchall()
        for r in rows:
            notify_event_review_prompt(cur, r["user_id"], r["event_id"], r["title"])
            cur.execute(
                "UPDATE event_attendees SET review_prompt_sent_at = NOW() WHERE id = %s::uuid",
                (r["row_id"],),
            )
        conn.commit()

    for r in rows:
        send_push(
            r["user_id"], "How was it?", f"Rate your night at {r['title']}.",
            {"type": "event_review_prompt", "event_id": r["event_id"]},
            get_event_image_url(r["event_id"]), category="attending",
        )
    return len(rows)


def _send_missed_notices() -> int:
    from routes.notifications import notify_event_missed

    with get_db() as (cur, conn):
        cur.execute(
            f"""
            SELECT ea.id::text AS row_id, ea.user_id::text, e.id::text AS event_id, e.title
            FROM event_attendees ea
            JOIN events e ON e.id = ea.event_id
            WHERE ea.status = 'going'
              AND ea.checked_in_at IS NULL
              AND ea.missed_event_notice_sent_at IS NULL
              AND e.is_cancelled = FALSE
              AND COALESCE(e.end_time, e.date_time) < NOW() - INTERVAL '{GRACE_MINUTES} minutes'
            """
        )
        rows = cur.fetchall()
        for r in rows:
            notify_event_missed(cur, r["user_id"], r["event_id"], r["title"])
            cur.execute(
                "UPDATE event_attendees SET missed_event_notice_sent_at = NOW() WHERE id = %s::uuid",
                (r["row_id"],),
            )
        conn.commit()

    for r in rows:
        send_push(
            r["user_id"], "Sorry you missed it",
            f"You didn't check in at {r['title']} — there's always the next one.",
            {"type": "event_missed", "event_id": r["event_id"]},
            get_event_image_url(r["event_id"]), category="attending",
        )
    return len(rows)

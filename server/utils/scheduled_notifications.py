"""Periodic notification sweeps — event-start reminders, wallet-expiry
nudges, birthday prompts, re-engagement pings, and post-event payout
notices. Same hand-rolled asyncio-loop pattern as utils/account_purge.py;
each check function is synchronous (run via asyncio.to_thread from the
loop in main.py) and idempotent — every send is guarded by an
UPDATE ... WHERE <flag> IS NULL (or an explicit stage counter) so re-running
the sweep never double-sends.
"""
from datetime import date, datetime, timedelta, timezone

from db.config import get_db
from utils.push import send_push, get_event_image_url


def check_event_reminders():
    """Runs frequently (see main.py's interval). For each stage, the WHERE
    clause is monotonic — once an event's date_time falls inside the
    window it stays inside it, so the per-attendee reminded_*_at flag is
    what actually prevents duplicate sends, not the window itself."""
    from routes.notifications import notify_event_starting_soon

    stages = [
        ("24h", "reminded_24h_at", timedelta(hours=24)),
        ("7h", "reminded_7h_at", timedelta(hours=7)),
        ("1h", "reminded_1h_at", timedelta(hours=1)),
    ]
    sent = 0
    with get_db() as (cur, conn):
        for stage, column, window in stages:
            cur.execute(
                f"""
                SELECT ea.id AS attendee_id, ea.user_id::text, e.id::text AS event_id, e.title
                FROM event_attendees ea
                JOIN events e ON e.id = ea.event_id
                WHERE ea.status = 'going'
                  AND ea.{column} IS NULL
                  AND e.is_cancelled = FALSE
                  AND e.date_time > NOW()
                  AND e.date_time <= NOW() + %s
                """,
                (window,),
            )
            rows = cur.fetchall()
            for r in rows:
                cur.execute(
                    f"UPDATE event_attendees SET {column} = NOW() WHERE id = %s AND {column} IS NULL",
                    (r["attendee_id"],),
                )
                if cur.rowcount == 0:
                    continue
                notify_event_starting_soon(cur, r["user_id"], r["event_id"], r["title"], stage)
                conn.commit()
                cover_url = get_event_image_url(r["event_id"])
                from routes.notifications import EVENT_REMINDER_COPY
                title, body_tpl = EVENT_REMINDER_COPY[stage]
                try:
                    send_push(r["user_id"], title, body_tpl.format(event_title=r["title"]),
                              {"type": "event", "event_id": r["event_id"]}, image_url=cover_url, category="attending")
                except Exception:
                    pass
                sent += 1
    return sent


def check_payout_notices():
    """Fires once per (paid) event, shortly after it ends."""
    from routes.notifications import notify_payout_coming_soon

    sent = 0
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT id::text, host_id::text, title
            FROM events
            WHERE is_cancelled = FALSE
              AND price_inr > 0
              AND payout_notice_sent_at IS NULL
              AND COALESCE(end_time, date_time + INTERVAL '3 hours') < NOW()
            """
        )
        rows = cur.fetchall()
        for r in rows:
            cur.execute(
                "UPDATE events SET payout_notice_sent_at = NOW() WHERE id = %s::uuid AND payout_notice_sent_at IS NULL",
                (r["id"],),
            )
            if cur.rowcount == 0:
                continue
            notify_payout_coming_soon(cur, r["host_id"], r["id"], r["title"])
            conn.commit()
            try:
                send_push(r["host_id"], "Your payout is on its way",
                          f"{r['title']} just wrapped — your payout will be sent soon.",
                          {"type": "event", "event_id": r["id"]}, image_url=get_event_image_url(r["id"]), category="hosting")
            except Exception:
                pass
            sent += 1
    return sent


def check_wallet_expiring():
    """Escalating cadence as a credit's expiry approaches: 30 days out, then
    14, then 7 — expiry_reminder_stage (0-3) tracks how far we've gone so
    each threshold fires exactly once per transaction."""
    from routes.notifications import notify_wallet_expiring

    thresholds = [(30, 1, "in 30 days"), (14, 2, "in 2 weeks"), (7, 3, "in 1 week")]
    sent = 0
    with get_db() as (cur, conn):
        for days, stage_num, label in thresholds:
            cur.execute(
                """
                SELECT id, user_id::text, amount_inr
                FROM wallet_transactions
                WHERE type = 'credit'
                  AND expires_at IS NOT NULL
                  AND expires_at > NOW()
                  AND expiry_reminder_stage < %s
                  AND expires_at <= NOW() + %s
                """,
                (stage_num, timedelta(days=days)),
            )
            rows = cur.fetchall()
            for r in rows:
                cur.execute(
                    "UPDATE wallet_transactions SET expiry_reminder_stage = %s WHERE id = %s AND expiry_reminder_stage < %s",
                    (stage_num, r["id"], stage_num),
                )
                if cur.rowcount == 0:
                    continue
                notify_wallet_expiring(cur, r["user_id"], r["amount_inr"], label)
                conn.commit()
                try:
                    send_push(r["user_id"], "Wallet credit expiring soon",
                              f"₹{r['amount_inr']} in your Gorave Wallet expires {label} — use it before it's gone.",
                              {"type": "wallet"}, category="payments")
                except Exception:
                    pass
                sent += 1
    return sent


def check_birthdays():
    """Same escalating-stage idea as wallet expiry, but reset yearly
    (birthday_reminder_year) since the same person has a birthday every
    year and the stage counter must not stay maxed out forever."""
    from routes.notifications import notify_birthday_soon

    today = date.today()
    stage_thresholds = [(15, 1), (10, 2), (7, 3)]
    sent = 0
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT id::text, dob, birthday_reminder_stage, birthday_reminder_year "
            "FROM users WHERE dob IS NOT NULL AND COALESCE(is_deleted, FALSE) = FALSE"
        )
        rows = cur.fetchall()
        for r in rows:
            dob = r["dob"]

            def _next_occurrence(month: int, day: int, from_date: date) -> date | None:
                for year in (from_date.year, from_date.year + 1, from_date.year + 2, from_date.year + 3):
                    try:
                        candidate = date(year, month, day)
                    except ValueError:
                        continue  # Feb 29 doesn't exist this year — try the next
                    if candidate >= from_date:
                        return candidate
                return None  # practically unreachable within a 4-year scan

            next_bday = _next_occurrence(dob.month, dob.day, today)
            if next_bday is None:
                continue
            days_until = (next_bday - today).days
            target_year = next_bday.year
            stage = r["birthday_reminder_stage"] if r["birthday_reminder_year"] == target_year else 0

            fire_days, fire_stage = None, None
            for threshold, stage_num in stage_thresholds:
                if days_until <= threshold and stage < stage_num:
                    fire_days, fire_stage = threshold, stage_num
            if fire_days is None:
                continue

            cur.execute(
                "UPDATE users SET birthday_reminder_stage = %s, birthday_reminder_year = %s "
                "WHERE id = %s::uuid AND (birthday_reminder_year IS DISTINCT FROM %s OR birthday_reminder_stage < %s)",
                (fire_stage, target_year, r["id"], target_year, fire_stage),
            )
            if cur.rowcount == 0:
                continue
            notify_birthday_soon(cur, r["id"], fire_days)
            conn.commit()
            from routes.notifications import BIRTHDAY_COPY
            title, body = BIRTHDAY_COPY[fire_days]
            try:
                send_push(r["id"], title, body, {"type": "createEvent"}, category="social")
            except Exception:
                pass
            sent += 1
    return sent


def check_reengagement():
    """Once every 14 days max per user, and only once they've been quiet
    for a week — last_reengagement_sent_at is both the de-dupe flag and
    the cooldown timer."""
    from routes.notifications import notify_reengagement

    sent = 0
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT id::text FROM users
            WHERE COALESCE(is_deleted, FALSE) = FALSE
              AND last_seen_at IS NOT NULL
              AND last_seen_at < NOW() - INTERVAL '7 days'
              AND (last_reengagement_sent_at IS NULL OR last_reengagement_sent_at < NOW() - INTERVAL '14 days')
            """
        )
        rows = cur.fetchall()
        for r in rows:
            cur.execute(
                "UPDATE users SET last_reengagement_sent_at = NOW() WHERE id = %s::uuid "
                "AND (last_reengagement_sent_at IS NULL OR last_reengagement_sent_at < NOW() - INTERVAL '14 days')",
                (r["id"],),
            )
            if cur.rowcount == 0:
                continue
            notify_reengagement(cur, r["id"])
            conn.commit()
            try:
                send_push(r["id"], "It's been a while \U0001f440",
                          "Here's what's happening near you this weekend — come see.",
                          {"type": "home"}, category="social")
            except Exception:
                pass
            sent += 1
    return sent


def run_daily_sweep():
    """Everything that only needs to be checked once a day."""
    results = {}
    for name, fn in [
        ("payout_notices", check_payout_notices),
        ("wallet_expiring", check_wallet_expiring),
        ("birthdays", check_birthdays),
        ("reengagement", check_reengagement),
    ]:
        try:
            results[name] = fn()
        except Exception as e:
            print(f"[SCHEDULED_NOTIF] {name} sweep failed: {e!r}", flush=True)
            results[name] = -1
    return results

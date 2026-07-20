from db.config import get_db
from utils.r2_client import r2_client

PURGE_AFTER_DAYS = 30
SENTINEL_USER_ID = "00000000-0000-0000-0000-000000000001"


def _ensure_sentinel_user(cur) -> None:
    cur.execute(
        """
        INSERT INTO users (id, phone, name, profile_complete, is_active, is_deleted)
        VALUES (%s::uuid, 'deleted-user', '[deleted]', TRUE, FALSE, TRUE)
        ON CONFLICT (id) DO NOTHING
        """,
        (SENTINEL_USER_ID,),
    )


def purge_expired_deleted_accounts() -> int:
    """Hard-deletes accounts that were soft-deleted more than PURGE_AFTER_DAYS
    ago. Past this point recovery is impossible — the 30-day "email us to
    restore" window in delete-account.tsx has closed.

    Order per user: (1) reassign any events they hosted to the sentinel
    "Deleted User" account, so other attendees' RSVP/review/payment history
    for those events survives; (2) delete their R2-stored files (photos,
    voice recording); (3) hard-delete the user row, which cascades via
    ON DELETE CASCADE through everything that's genuinely theirs alone
    (messages, follows, wallet transactions, their own RSVPs, etc. — see
    queries.sql).
    """
    with get_db() as (cur, conn):
        _ensure_sentinel_user(cur)
        conn.commit()

        cur.execute(
            f"""
            SELECT id::text FROM users
            WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL '{PURGE_AFTER_DAYS} days'
              AND id != %s::uuid
            """,
            (SENTINEL_USER_ID,),
        )
        expired = [row["id"] for row in cur.fetchall()]

    for uid in expired:
        with get_db() as (cur, _):
            cur.execute("SELECT r2_path FROM user_photos WHERE user_id = %s::uuid", (uid,))
            photo_paths = [row["r2_path"] for row in cur.fetchall()]
            cur.execute("SELECT voice_r2_path FROM users WHERE id = %s::uuid", (uid,))
            row = cur.fetchone()
            voice_path = row["voice_r2_path"] if row else None

        for path in photo_paths:
            try:
                r2_client.delete_file(path)
            except Exception as e:
                print(f"[PURGE] R2 photo delete failed for user {uid}: {e}", flush=True)
        if voice_path:
            try:
                r2_client.delete_file(voice_path)
            except Exception as e:
                print(f"[PURGE] R2 voice delete failed for user {uid}: {e}", flush=True)

        with get_db() as (cur, conn):
            cur.execute(
                "UPDATE events SET host_id = %s::uuid WHERE host_id = %s::uuid",
                (SENTINEL_USER_ID, uid),
            )
            cur.execute("DELETE FROM users WHERE id = %s::uuid", (uid,))
            conn.commit()
        print(f"[PURGE] Hard-deleted user {uid} (30-day window elapsed)", flush=True)

    return len(expired)

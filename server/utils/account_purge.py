from db.config import get_db
from utils.r2_client import r2_client

PURGE_AFTER_DAYS = 30


def purge_expired_deleted_accounts() -> int:
    """Hard-deletes accounts that were soft-deleted more than PURGE_AFTER_DAYS
    ago. Past this point recovery is impossible — the 30-day "email us to
    restore" window in delete-account.tsx has closed. Deletes R2-stored
    files first (photos, voice recording), then hard-deletes the user row;
    every other table cascades via ON DELETE CASCADE (see queries.sql).

    Note: since events.host_id also cascades, this also removes any past
    events the purged user hosted — including other users' attendance,
    reviews, and payment records for those events. That's accepted as
    intended full-purge behavior, not a bug.
    """
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT id::text FROM users
            WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL '%s days'
            """ % PURGE_AFTER_DAYS
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
            cur.execute("DELETE FROM users WHERE id = %s::uuid", (uid,))
            conn.commit()
        print(f"[PURGE] Hard-deleted user {uid} (30-day window elapsed)", flush=True)

    return len(expired)

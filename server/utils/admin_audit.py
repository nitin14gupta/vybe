from db.config import get_db


def log_action(admin_id: str, action: str, target_type: str, target_id: str | None = None, detail: str | None = None):
    """Records an admin moderation action — see queries.sql::admin_audit_log.
    Called after the action's own commit succeeds, so a logging failure never
    blocks the actual moderation action; best-effort, swallow errors."""
    try:
        with get_db() as (cur, conn):
            cur.execute(
                """
                INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, detail)
                VALUES (%s::uuid, %s, %s, %s::uuid, %s)
                """,
                (admin_id, action, target_type, target_id, detail),
            )
            conn.commit()
    except Exception as e:
        print(f"[admin_audit] failed to log {action} on {target_type}/{target_id}: {e}", flush=True)

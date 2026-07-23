from fastapi import APIRouter, Query, Depends

from db.config import get_db
from middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/audit-log", tags=["admin-audit-log"])


@router.get("")
def list_audit_log(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    with get_db() as (cur, _):
        cur.execute("SELECT COUNT(*)::int AS count FROM admin_audit_log")
        total = cur.fetchone()["count"]

        cur.execute(
            """
            SELECT l.id::text, l.action, l.target_type, l.target_id::text, l.detail, l.created_at,
                   a.id::text AS admin_id, a.name AS admin_name, a.email AS admin_email
            FROM admin_audit_log l
            JOIN admin_users a ON a.id = l.admin_id
            ORDER BY l.created_at DESC
            LIMIT %s OFFSET %s
            """,
            (page_size, offset),
        )
        rows = cur.fetchall()

    return {"items": rows, "total": total, "page": page, "page_size": page_size}

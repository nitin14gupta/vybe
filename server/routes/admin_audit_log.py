from fastapi import APIRouter, HTTPException, Query, Depends

from db.config import get_db
from middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/audit-log", tags=["admin-audit-log"])

VALID_ACTIONS = {"lock_user", "unlock_user", "force_cancel_event", "update_support_status"}


@router.get("")
def list_audit_log(
    q: str | None = Query(default=None),
    action: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    if action and action not in VALID_ACTIONS:
        raise HTTPException(status_code=422, detail=f"action must be one of {sorted(VALID_ACTIONS)}")

    offset = (page - 1) * page_size
    filters = []
    params: list = []

    if q:
        filters.append("(a.name ILIKE %s OR a.email ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])
    if action:
        filters.append("l.action = %s")
        params.append(action)

    where = f"WHERE {' AND '.join(filters)}" if filters else ""

    with get_db() as (cur, _):
        cur.execute(
            f"SELECT COUNT(*)::int AS count FROM admin_audit_log l JOIN admin_users a ON a.id = l.admin_id {where}",
            params,
        )
        total = cur.fetchone()["count"]

        cur.execute(
            f"""
            SELECT l.id::text, l.action, l.target_type, l.target_id::text, l.detail, l.created_at,
                   a.id::text AS admin_id, a.name AS admin_name, a.email AS admin_email
            FROM admin_audit_log l
            JOIN admin_users a ON a.id = l.admin_id
            {where}
            ORDER BY l.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = cur.fetchall()

    return {"items": rows, "total": total, "page": page, "page_size": page_size}

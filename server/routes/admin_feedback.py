from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel

from db.config import get_db
from middleware.admin_auth import get_current_admin
from utils.admin_audit import log_action

router = APIRouter(prefix="/admin/feedback", tags=["admin-feedback"])

VALID_STATUSES = {"open", "resolved", "closed"}


class UpdateSupportStatusBody(BaseModel):
    status: str


# ── GET /admin/feedback/app-feedback ─────────────────────────────────────────

@router.get("/app-feedback")
def list_app_feedback(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    with get_db() as (cur, _):
        cur.execute("SELECT COUNT(*)::int AS count FROM app_feedback")
        total = cur.fetchone()["count"]

        cur.execute(
            """
            SELECT f.id::text, f.text, f.created_at,
                   u.id::text AS user_id, u.name AS user_name, u.phone AS user_phone
            FROM app_feedback f
            JOIN users u ON u.id = f.user_id
            ORDER BY f.created_at DESC
            LIMIT %s OFFSET %s
            """,
            (page_size, offset),
        )
        rows = cur.fetchall()

    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/feedback/support ───────────────────────────────────────────────

@router.get("/support")
def list_support_requests(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    filters = []
    params: list = []
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUSES)}")
        filters.append("s.status = %s")
        params.append(status)

    where = f"WHERE {' AND '.join(filters)}" if filters else ""

    with get_db() as (cur, _):
        cur.execute(f"SELECT COUNT(*)::int AS count FROM support_requests s {where}", params)
        total = cur.fetchone()["count"]

        cur.execute(
            f"""
            SELECT s.id::text, s.topic, s.message, s.status, s.created_at,
                   u.id::text AS user_id, u.name AS user_name, u.phone AS user_phone
            FROM support_requests s
            JOIN users u ON u.id = s.user_id
            {where}
            ORDER BY s.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = cur.fetchall()

    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── PATCH /admin/feedback/support/{request_id} ────────────────────────────────

@router.patch("/support/{request_id}")
def update_support_status(
    request_id: str, body: UpdateSupportStatusBody, current_admin: dict = Depends(get_current_admin),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUSES)}")

    with get_db() as (cur, conn):
        cur.execute("SELECT id FROM support_requests WHERE id = %s::uuid", (request_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Support request not found")

        cur.execute(
            "UPDATE support_requests SET status = %s WHERE id = %s::uuid",
            (body.status, request_id),
        )
        conn.commit()

    log_action(current_admin["id"], "update_support_status", "support_request", request_id, body.status)

    return {"ok": True}

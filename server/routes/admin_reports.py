from fastapi import APIRouter, Query, Depends

from db.config import get_db
from middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


def _paginated(cur, count_sql, count_params, list_sql, list_params, page, page_size):
    cur.execute(count_sql, count_params)
    total = cur.fetchone()["count"]
    cur.execute(list_sql, [*list_params, page_size, (page - 1) * page_size])
    return cur.fetchall(), total


# ── GET /admin/reports/users ───────────────────────────────────────────────────

@router.get("/users")
def list_user_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM user_reports",
            [],
            """
            SELECT ur.id::text, ur.reason, ur.created_at,
                   reporter.id::text AS reporter_id, reporter.name AS reporter_name, reporter.phone AS reporter_phone,
                   reported.id::text AS reported_id, reported.name AS reported_name, reported.phone AS reported_phone
            FROM user_reports ur
            JOIN users reporter ON reporter.id = ur.reporter_id
            JOIN users reported ON reported.id = ur.reported_id
            ORDER BY ur.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/reports/events ──────────────────────────────────────────────────

@router.get("/events")
def list_event_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM event_reports",
            [],
            """
            SELECT er.id::text, er.reason, er.description, er.created_at,
                   u.id::text AS reporter_id, u.name AS reporter_name, u.phone AS reporter_phone,
                   e.id::text AS event_id, e.title AS event_title, e.is_cancelled AS event_is_cancelled
            FROM event_reports er
            JOIN users u ON u.id = er.reporter_id
            JOIN events e ON e.id = er.event_id
            ORDER BY er.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/reports/messages ────────────────────────────────────────────────

@router.get("/messages")
def list_message_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM message_reports",
            [],
            """
            SELECT mr.id::text, mr.reason, mr.description, mr.created_at,
                   reporter.id::text AS reporter_id, reporter.name AS reporter_name, reporter.phone AS reporter_phone,
                   m.id::text AS message_id, m.content AS message_content, m.content_type AS message_content_type,
                   m.sent_at AS message_sent_at,
                   sender.id::text AS sender_id, sender.name AS sender_name
            FROM message_reports mr
            JOIN users reporter ON reporter.id = mr.reporter_id
            JOIN messages m ON m.id = mr.message_id
            JOIN users sender ON sender.id = m.sender_id
            ORDER BY mr.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/reports/blocks ───────────────────────────────────────────────────

@router.get("/blocks")
def list_blocks(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM user_blocks",
            [],
            """
            SELECT ub.id::text, ub.created_at,
                   blocker.id::text AS blocker_id, blocker.name AS blocker_name, blocker.phone AS blocker_phone,
                   blocked.id::text AS blocked_id, blocked.name AS blocked_name, blocked.phone AS blocked_phone
            FROM user_blocks ub
            JOIN users blocker ON blocker.id = ub.blocker_id
            JOIN users blocked ON blocked.id = ub.blocked_id
            ORDER BY ub.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}

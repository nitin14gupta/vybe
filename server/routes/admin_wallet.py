from fastapi import APIRouter, HTTPException, Query, Depends

from db.config import get_db
from middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/wallet", tags=["admin-wallet"])

VALID_TYPES = {"credit", "debit", "refund_requested"}
VALID_SOURCES = {"event_refund", "ticket_purchase", "bank_refund_request"}


# ── GET /admin/wallet/stats ────────────────────────────────────────────────────

@router.get("/stats")
def wallet_stats(current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute("SELECT COALESCE(SUM(wallet_balance), 0)::int AS total FROM users")
        total_liability = cur.fetchone()["total"]

        cur.execute(
            """
            SELECT
                COALESCE(SUM(amount_inr) FILTER (WHERE type = 'credit'), 0)::int AS total_credits,
                COALESCE(SUM(amount_inr) FILTER (WHERE type = 'debit'), 0)::int AS total_debits,
                COUNT(*) FILTER (WHERE type = 'credit')::int AS credit_count,
                COUNT(*) FILTER (WHERE type = 'debit')::int AS debit_count
            FROM wallet_transactions
            """
        )
        agg = cur.fetchone()

    return {
        "total_liability": total_liability,
        "total_credits": agg["total_credits"],
        "total_debits": agg["total_debits"],
        "credit_count": agg["credit_count"],
        "debit_count": agg["debit_count"],
    }


# ── GET /admin/wallet/transactions ────────────────────────────────────────────

@router.get("/transactions")
def list_transactions(
    type: str | None = Query(default=None),
    source: str | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    if type and type not in VALID_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {sorted(VALID_TYPES)}")
    if source and source not in VALID_SOURCES:
        raise HTTPException(status_code=422, detail=f"source must be one of {sorted(VALID_SOURCES)}")

    offset = (page - 1) * page_size
    filters = []
    params: list = []

    if type:
        filters.append("t.type = %s")
        params.append(type)
    if source:
        filters.append("t.source = %s")
        params.append(source)
    if q:
        filters.append("(u.name ILIKE %s OR u.phone ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])

    where = f"WHERE {' AND '.join(filters)}" if filters else ""

    with get_db() as (cur, _):
        cur.execute(f"SELECT COUNT(*)::int AS count FROM wallet_transactions t JOIN users u ON u.id = t.user_id {where}", params)
        total = cur.fetchone()["count"]

        cur.execute(
            f"""
            SELECT t.id::text, t.amount_inr, t.type, t.source, t.description,
                   t.expires_at, t.created_at,
                   u.id::text AS user_id, u.name AS user_name, u.phone AS user_phone
            FROM wallet_transactions t
            JOIN users u ON u.id = t.user_id
            {where}
            ORDER BY t.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = cur.fetchall()

    return {"items": rows, "total": total, "page": page, "page_size": page_size}

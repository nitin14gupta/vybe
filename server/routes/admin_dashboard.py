from datetime import date, timedelta
from fastapi import APIRouter, Depends

from db.config import get_db
from middleware.admin_auth import get_current_admin
from routes.admin_events import _ACTIVE_SQL, _UPCOMING_SQL, _PAST_SQL

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])

DAYS_BACK = 30


def _fill_days(rows: list[dict], value_keys: list[str]) -> list[dict]:
    """Left-joins a sparse day->value SQL result onto a complete last-30-days
    range so the chart doesn't show gaps for days with zero activity."""
    by_day = {r["day"].isoformat(): r for r in rows}
    today = date.today()
    out = []
    for i in range(DAYS_BACK - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        row = by_day.get(d)
        out.append({"day": d, **{k: (row[k] if row else 0) for k in value_keys}})
    return out


@router.get("")
def get_dashboard(current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute("SELECT COUNT(*)::int AS count FROM users WHERE COALESCE(is_deleted, FALSE) = FALSE")
        total_users = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*)::int AS count FROM users WHERE COALESCE(is_locked, FALSE) = TRUE")
        locked_users = cur.fetchone()["count"]

        cur.execute(f"SELECT COUNT(*)::int AS count FROM events e WHERE {_ACTIVE_SQL}")
        active_events = cur.fetchone()["count"]

        cur.execute(f"SELECT COUNT(*)::int AS count FROM events e WHERE {_UPCOMING_SQL}")
        upcoming_events = cur.fetchone()["count"]

        cur.execute(f"SELECT COUNT(*)::int AS count FROM events e WHERE {_PAST_SQL}")
        past_events = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*)::int AS count FROM events WHERE is_cancelled = TRUE")
        cancelled_events = cur.fetchone()["count"]

        cur.execute("SELECT COALESCE(SUM(wallet_balance), 0)::int AS total FROM users")
        wallet_liability = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(*)::int AS count FROM support_requests WHERE status = 'open'")
        open_tickets = cur.fetchone()["count"]

        stats = {
            "total_users": total_users,
            "locked_users": locked_users,
            "active_events": active_events,
            "upcoming_events": upcoming_events,
            "past_events": past_events,
            "cancelled_events": cancelled_events,
            "wallet_liability": wallet_liability,
            "open_tickets": open_tickets,
        }

        cur.execute(
            """
            SELECT created_at::date AS day, COUNT(*)::int AS count
            FROM users
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY day
            """
        )
        signups_by_day = _fill_days(cur.fetchall(), ["count"])

        cur.execute(
            """
            SELECT event_type, COUNT(*)::int AS count
            FROM events
            GROUP BY event_type
            ORDER BY count DESC
            LIMIT 8
            """
        )
        events_by_type = cur.fetchall()

        cur.execute(
            """
            SELECT created_at::date AS day,
                   COALESCE(SUM(amount_inr) FILTER (WHERE type = 'credit'), 0)::int AS credits,
                   COALESCE(SUM(amount_inr) FILTER (WHERE type = 'debit'), 0)::int AS debits
            FROM wallet_transactions
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY day
            """
        )
        wallet_flow_by_day = _fill_days(cur.fetchall(), ["credits", "debits"])

        cur.execute("SELECT status, COUNT(*)::int AS count FROM support_requests GROUP BY status")
        support_by_status = cur.fetchall()

    return {
        "stats": stats,
        "signups_by_day": signups_by_day,
        "events_by_type": events_by_type,
        "wallet_flow_by_day": wallet_flow_by_day,
        "support_by_status": support_by_status,
    }

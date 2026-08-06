from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("")
def get_wallet(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
        row = cur.fetchone()
        balance = row["wallet_balance"] if row else 0
        cur.execute(
            """
            SELECT wt.id::text, wt.amount_inr, wt.type, wt.source, wt.description,
                   to_char(wt.expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS expires_at,
                   to_char(wt.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                   e.title AS event_title,
                   e.cover_photos[1] AS event_cover
            FROM wallet_transactions wt
            LEFT JOIN events e
                ON wt.source IN ('ticket_purchase', 'event_refund') AND e.id = wt.reference_id
            WHERE wt.user_id = %s::uuid
            ORDER BY wt.created_at DESC
            LIMIT 30
            """,
            (uid,),
        )
        transactions = [dict(r) for r in cur.fetchall()]
    return {"balance": balance, "transactions": transactions}

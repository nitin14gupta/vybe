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
            SELECT id::text, amount_inr, type, source, description,
                   to_char(expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS expires_at,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM wallet_transactions
            WHERE user_id = %s::uuid
            ORDER BY created_at DESC
            LIMIT 30
            """,
            (uid,),
        )
        transactions = [dict(r) for r in cur.fetchall()]
    return {"balance": balance, "transactions": transactions}

from fastapi import APIRouter, Depends, HTTPException
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
                   expires_at::text, created_at::text
            FROM wallet_transactions
            WHERE user_id = %s::uuid
            ORDER BY created_at DESC
            LIMIT 30
            """,
            (uid,),
        )
        transactions = [dict(r) for r in cur.fetchall()]
    return {"balance": balance, "transactions": transactions}


@router.post("/bank-refund-request")
def request_bank_refund(current_user: dict = Depends(get_current_user)):
    """Mark a bank refund request — admin panel processes the actual payout."""
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
        row = cur.fetchone()
        if not row or row["wallet_balance"] <= 0:
            raise HTTPException(status_code=400, detail="No wallet balance to refund")
        amount = row["wallet_balance"]

        # Block duplicate requests within 7 days
        cur.execute(
            """
            SELECT 1 FROM wallet_transactions
            WHERE user_id = %s::uuid AND type = 'refund_requested'
              AND created_at > NOW() - INTERVAL '7 days'
            """,
            (uid,),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="A refund request is already pending")

        cur.execute(
            "UPDATE users SET wallet_balance = 0 WHERE id = %s::uuid",
            (uid,),
        )
        cur.execute(
            """
            INSERT INTO wallet_transactions
                (user_id, amount_inr, type, source, description)
            VALUES (%s::uuid, %s, 'refund_requested', 'bank_refund_request',
                    'Bank refund requested — processing 5–10 business days')
            """,
            (uid, amount),
        )
        conn.commit()
    return {"ok": True, "amount": amount}

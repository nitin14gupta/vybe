import hashlib
import hmac
import os

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from db.config import get_db
from middleware.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

_rz_client: Optional[razorpay.Client] = None


def _get_rz() -> razorpay.Client:
    global _rz_client
    if _rz_client is None:
        key_id = os.getenv("RAZORPAY_KEY_ID")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        if not key_id or not key_secret:
            raise RuntimeError("Razorpay credentials not configured")
        _rz_client = razorpay.Client(auth=(key_id, key_secret))
    return _rz_client


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateOrderBody(BaseModel):
    event_id: str
    wallet_amount: int = 0


class VerifyPaymentBody(BaseModel):
    event_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    wallet_amount: int = 0


class WalletPayBody(BaseModel):
    event_id: str


# ── GET /payments/public-key ─────────────────────────────────────────────────

@router.get("/public-key")
def get_public_key(current_user: dict = Depends(get_current_user)):
    """Returns the Razorpay public key so the client can initialise the SDK early."""
    return {"key": os.getenv("RAZORPAY_KEY_ID")}


# ── POST /payments/create-order ───────────────────────────────────────────────

@router.post("/create-order")
def create_order(body: CreateOrderBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]

    with get_db() as (cur, _):
        cur.execute(
            "SELECT price_inr, title, spots_left FROM events WHERE id = %s AND is_cancelled = FALSE",
            (body.event_id,),
        )
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["spots_left"] <= 0:
            raise HTTPException(status_code=409, detail="No spots left for this event")

        cur.execute(
            "SELECT wallet_balance, phone, country_code FROM users WHERE id = %s::uuid", (uid,)
        )
        user = cur.fetchone()
        wallet_bal = user["wallet_balance"] if user else 0
        raw_phone = (user["phone"] or "") if user else ""
        country_code = (user.get("country_code") or "+91") if user else "+91"
        contact = f"{country_code}{raw_phone}".replace(" ", "")

    ticket_price = ev["price_inr"]
    platform_fee = round(ticket_price * 0.05)
    total = ticket_price + platform_fee

    wallet_use = max(0, min(body.wallet_amount, wallet_bal, total))
    razorpay_charge = total - wallet_use

    if razorpay_charge == 0:
        return {
            "full_wallet": True,
            "wallet_amount": wallet_use,
            "total": total,
            "ticket_price": ticket_price,
            "platform_fee": platform_fee,
        }

    rz = _get_rz()
    order = rz.order.create({
        "amount": razorpay_charge * 100,
        "currency": "INR",
        "payment_capture": 1,
        "notes": {"event_id": body.event_id, "user_id": uid},
    })

    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO payment_orders
                (user_id, event_id, razorpay_order_id, amount_inr,
                 wallet_amount_inr, razorpay_amount_inr)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s)
            """,
            (uid, body.event_id, order["id"], total, wallet_use, razorpay_charge),
        )
        conn.commit()

    return {
        "full_wallet": False,
        "order_id": order["id"],
        "razorpay_key": os.getenv("RAZORPAY_KEY_ID"),
        "amount": razorpay_charge,
        "total": total,
        "ticket_price": ticket_price,
        "platform_fee": platform_fee,
        "wallet_amount": wallet_use,
        "event_title": ev["title"],
        "contact": contact,
        "email": f"pay_{uid[:8]}@vybe.in",
    }


# ── POST /payments/verify ─────────────────────────────────────────────────────

@router.post("/verify")
def verify_payment(body: VerifyPaymentBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]

    msg = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    expected = hmac.new(key_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    with get_db() as (cur, _):
        cur.execute(
            "SELECT status FROM payment_orders WHERE razorpay_order_id = %s AND user_id = %s::uuid",
            (body.razorpay_order_id, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    if row["status"] == "paid":
        return {"ok": True, "status": "going"}

    _finalise_rsvp(
        order_id=body.razorpay_order_id,
        event_id=body.event_id,
        uid=uid,
        payment_id=body.razorpay_payment_id,
        wallet_amount=body.wallet_amount,
    )
    return {"ok": True, "status": "going"}


# ── POST /payments/wallet-pay ─────────────────────────────────────────────────

@router.post("/wallet-pay")
def wallet_pay(body: WalletPayBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]

    with get_db() as (cur, _):
        cur.execute(
            "SELECT price_inr, spots_left FROM events WHERE id = %s AND is_cancelled = FALSE",
            (body.event_id,),
        )
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["spots_left"] <= 0:
            raise HTTPException(status_code=409, detail="No spots left")

        ticket_price = ev["price_inr"]
        platform_fee = round(ticket_price * 0.05)
        total = ticket_price + platform_fee

        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
        user = cur.fetchone()
        bal = user["wallet_balance"] if user else 0
        if bal < total:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE users SET wallet_balance = wallet_balance - %s WHERE id = %s::uuid",
            (total, uid),
        )
        cur.execute(
            """
            INSERT INTO wallet_transactions
                (user_id, amount_inr, type, source, reference_id, description)
            VALUES (%s::uuid, %s, 'debit', 'ticket_purchase', %s::uuid, 'Ticket purchase via wallet')
            """,
            (uid, total, body.event_id),
        )
        cur.execute(
            """
            INSERT INTO event_attendees (event_id, user_id, status, payment_id)
            VALUES (%s::uuid, %s::uuid, 'going', 'wallet')
            ON CONFLICT (event_id, user_id)
            DO UPDATE SET status = 'going', payment_id = 'wallet', offer_expires_at = NULL
            """,
            (body.event_id, uid),
        )
        cur.execute(
            "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s::uuid",
            (body.event_id,),
        )
        conn.commit()

    return {"ok": True, "status": "going"}


# ── Internal helper ───────────────────────────────────────────────────────────

def _finalise_rsvp(*, order_id: str, event_id: str, uid: str, payment_id: str, wallet_amount: int):
    with get_db() as (cur, conn):
        if wallet_amount > 0:
            cur.execute(
                "UPDATE users SET wallet_balance = wallet_balance - %s WHERE id = %s::uuid AND wallet_balance >= %s",
                (wallet_amount, uid, wallet_amount),
            )
            cur.execute(
                """
                INSERT INTO wallet_transactions
                    (user_id, amount_inr, type, source, reference_id, description)
                VALUES (%s::uuid, %s, 'debit', 'ticket_purchase', %s::uuid, 'Wallet used for ticket')
                """,
                (uid, wallet_amount, event_id),
            )
        cur.execute(
            "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = %s WHERE razorpay_order_id = %s",
            (payment_id, order_id),
        )
        cur.execute(
            """
            INSERT INTO event_attendees (event_id, user_id, status, payment_id)
            VALUES (%s::uuid, %s::uuid, 'going', %s)
            ON CONFLICT (event_id, user_id)
            DO UPDATE SET status = 'going', payment_id = %s, offer_expires_at = NULL
            """,
            (event_id, uid, payment_id, payment_id),
        )
        cur.execute(
            "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s::uuid",
            (event_id,),
        )
        conn.commit()

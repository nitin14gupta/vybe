import hashlib
import hmac
import os

import razorpay
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from db.config import get_db
from middleware.auth import get_current_user
from utils.push import send_push

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
    wallet_amount: int = 0  # rupees the user wants to apply from their wallet


class VerifyPaymentBody(BaseModel):
    event_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    wallet_amount: int = 0


class WalletPayBody(BaseModel):
    event_id: str


class UpiIntentBody(BaseModel):
    event_id: str
    wallet_amount: int = 0


class UpiCollectBody(BaseModel):
    event_id: str
    vpa: str          # user's UPI ID e.g. name@oksbi
    wallet_amount: int = 0


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

        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
        user = cur.fetchone()
        wallet_bal = user["wallet_balance"] if user else 0

    ticket_price = ev["price_inr"]
    platform_fee = round(ticket_price * 0.05)
    total = ticket_price + platform_fee

    # Clamp wallet usage to what's available and what's needed
    wallet_use = max(0, min(body.wallet_amount, wallet_bal, total))
    razorpay_charge = total - wallet_use

    if razorpay_charge == 0:
        # Full wallet payment — caller should use /payments/wallet-pay instead
        return {
            "full_wallet": True,
            "wallet_amount": wallet_use,
            "total": total,
            "ticket_price": ticket_price,
            "platform_fee": platform_fee,
        }

    rz = _get_rz()
    order = rz.order.create({
        "amount": razorpay_charge * 100,  # paise
        "currency": "INR",
        "payment_capture": 1,
        "notes": {
            "event_id": body.event_id,
            "user_id": uid,
        },
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
    }


# ── GET /payments/status/{order_id} ──────────────────────────────────────────

@router.get("/status/{order_id}")
def payment_status(order_id: str, current_user: dict = Depends(get_current_user)):
    """Poll for UPI payment completion after returning from the UPI app."""
    with get_db() as (cur, _):
        cur.execute(
            "SELECT status, event_id::text, wallet_amount_inr FROM payment_orders WHERE razorpay_order_id = %s AND user_id = %s::uuid",
            (order_id, current_user["id"]),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    if row["status"] == "paid":
        return {"status": "paid", "event_id": row["event_id"]}

    # Ask Razorpay
    rz = _get_rz()
    payments = rz.order.payments(order_id)
    items = payments.get("items", [])
    captured = next((p for p in items if p.get("status") == "captured"), None)

    if captured:
        # Payment completed — finalise RSVP
        _finalise_rsvp(
            order_id=order_id,
            event_id=row["event_id"],
            uid=current_user["id"],
            payment_id=captured["id"],
            wallet_amount=row["wallet_amount_inr"],
        )
        return {"status": "paid", "event_id": row["event_id"]}

    failed = next((p for p in items if p.get("status") == "failed"), None)
    if failed:
        with get_db() as (cur, conn):
            cur.execute(
                "UPDATE payment_orders SET status = 'failed' WHERE razorpay_order_id = %s",
                (order_id,),
            )
            conn.commit()
        return {"status": "failed"}

    return {"status": "pending"}


# ── POST /payments/verify ─────────────────────────────────────────────────────

@router.post("/verify")
def verify_payment(body: VerifyPaymentBody, current_user: dict = Depends(get_current_user)):
    """Verify Razorpay signature (used after WebView card payment returns)."""
    uid = current_user["id"]

    # Signature check
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
    """Full wallet payment — no Razorpay order required."""
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
        # Deduct wallet
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
        # Create attendee record
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


# ── Shared helper: create Razorpay order + insert into payment_orders ─────────

def _create_rz_order(uid: str, event_id: str, wallet_amount: int, cur) -> dict:
    """Validates event, clamps wallet usage, creates Razorpay order. Returns dict with all computed values."""
    cur.execute(
        "SELECT price_inr, title, spots_left FROM events WHERE id = %s AND is_cancelled = FALSE",
        (event_id,),
    )
    ev = cur.fetchone()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["spots_left"] <= 0:
        raise HTTPException(status_code=409, detail="No spots left for this event")

    cur.execute("SELECT wallet_balance, phone, country_code FROM users WHERE id = %s::uuid", (uid,))
    user = cur.fetchone()
    wallet_bal = user["wallet_balance"] if user else 0
    phone = user["phone"] if user else ""
    country_code = (user.get("country_code") or "+91") if user else "+91"

    ticket_price = ev["price_inr"]
    platform_fee = round(ticket_price * 0.05)
    total = ticket_price + platform_fee
    wallet_use = max(0, min(wallet_amount, wallet_bal, total))
    razorpay_charge = total - wallet_use

    rz = _get_rz()
    order = rz.order.create({
        "amount": razorpay_charge * 100,
        "currency": "INR",
        "payment_capture": 1,
        "notes": {"event_id": event_id, "user_id": uid},
    })

    return {
        "order": order,
        "total": total,
        "ticket_price": ticket_price,
        "platform_fee": platform_fee,
        "wallet_use": wallet_use,
        "razorpay_charge": razorpay_charge,
        "ev_title": ev["title"],
        "phone": phone,
        "country_code": country_code,
    }


# ── POST /payments/upi-intent ─────────────────────────────────────────────────

@router.post("/upi-intent")
def create_upi_intent(body: UpiIntentBody, current_user: dict = Depends(get_current_user)):
    """
    Creates a Razorpay UPI intent payment server-side.
    Returns an intent_url that the client opens via Linking.openURL() to launch GPay/PhonePe etc.
    Razorpay embeds the merchant VPA internally — no merchant VPA management needed on our side.
    """
    uid = current_user["id"]

    with get_db() as (cur, conn):
        d = _create_rz_order(uid, body.event_id, body.wallet_amount, cur)

        if d["razorpay_charge"] == 0:
            return {"full_wallet": True, "wallet_amount": d["wallet_use"], "total": d["total"]}

        order = d["order"]
        contact = f"{d['country_code']}{d['phone']}"
        # Use an internal email; Razorpay requires one but we don't collect it from users
        email = f"pay_{uid[:8]}@vybe.app"

        try:
            rz = _get_rz()
            upi_resp = rz.payment.create_upi({
                "amount": d["razorpay_charge"] * 100,
                "currency": "INR",
                "order_id": order["id"],
                "method": "upi",
                "upi": {"flow": "intent"},
                "email": email,
                "contact": contact,
            })
            # Extract the upi:// intent URL from Razorpay's response
            intent_url = None
            next_actions = upi_resp.get("next") or []
            if isinstance(next_actions, list) and next_actions:
                intent_url = next_actions[0].get("url")
        except Exception:
            # If S2S UPI intent creation fails (e.g. test mode limitation),
            # fall back — client will use RazorpayCheckout.open() instead
            intent_url = None
            upi_resp = {}

        payment_id = upi_resp.get("razorpay_payment_id") or upi_resp.get("id")

        cur.execute(
            """
            INSERT INTO payment_orders
                (user_id, event_id, razorpay_order_id, amount_inr,
                 wallet_amount_inr, razorpay_amount_inr)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s)
            """,
            (uid, body.event_id, order["id"], d["total"], d["wallet_use"], d["razorpay_charge"]),
        )
        conn.commit()

    return {
        "full_wallet": False,
        "order_id": order["id"],
        "razorpay_key": os.getenv("RAZORPAY_KEY_ID"),
        "payment_id": payment_id,
        "intent_url": intent_url,          # upi:// deep link — open with Linking.openURL()
        "amount": d["razorpay_charge"],
        "total": d["total"],
        "wallet_amount": d["wallet_use"],
        "event_title": d["ev_title"],
    }


# ── POST /payments/upi-collect ────────────────────────────────────────────────

@router.post("/upi-collect")
def create_upi_collect(body: UpiCollectBody, current_user: dict = Depends(get_current_user)):
    """
    Sends a UPI collect request to the user's VPA. The user approves it in their UPI app.
    Client polls GET /payments/status/{order_id} to confirm capture.
    """
    uid = current_user["id"]
    vpa = body.vpa.strip()
    if "@" not in vpa:
        raise HTTPException(status_code=400, detail="Invalid UPI ID")

    with get_db() as (cur, conn):
        d = _create_rz_order(uid, body.event_id, body.wallet_amount, cur)

        if d["razorpay_charge"] == 0:
            return {"full_wallet": True, "wallet_amount": d["wallet_use"], "total": d["total"]}

        order = d["order"]
        contact = f"{d['country_code']}{d['phone']}"

        rz = _get_rz()
        upi_resp = rz.payment.create_upi({
            "amount": d["razorpay_charge"] * 100,
            "currency": "INR",
            "order_id": order["id"],
            "method": "upi",
            "upi": {"flow": "collect", "vpa": vpa},
            "email": f"pay_{uid[:8]}@vybe.app",
            "contact": contact,
        })

        payment_id = upi_resp.get("razorpay_payment_id") or upi_resp.get("id")

        cur.execute(
            """
            INSERT INTO payment_orders
                (user_id, event_id, razorpay_order_id, amount_inr,
                 wallet_amount_inr, razorpay_amount_inr)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s)
            """,
            (uid, body.event_id, order["id"], d["total"], d["wallet_use"], d["razorpay_charge"]),
        )
        conn.commit()

    return {
        "full_wallet": False,
        "order_id": order["id"],
        "payment_id": payment_id,
        "amount": d["razorpay_charge"],
        "total": d["total"],
        "wallet_amount": d["wallet_use"],
    }

import hashlib
import hmac
import os
import time
from datetime import datetime, timezone
from io import BytesIO

import cv2
import numpy as np
import razorpay
import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request
from PIL import Image
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


class CreateQrBody(BaseModel):
    event_id: str
    wallet_amount: int = 0


class SaveUpiBody(BaseModel):
    upi_id: str
    name: str


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


# ── QR decode helper ─────────────────────────────────────────────────────────

def _decode_qr_image(image_url: str) -> str:
    """Download Razorpay QR image and decode the embedded UPI payment URL."""
    try:
        resp = http_requests.get(image_url, timeout=10, allow_redirects=True)
        resp.raise_for_status()
        img_pil = Image.open(BytesIO(resp.content)).convert("RGB")
        img_np = np.array(img_pil)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(img_bgr)
        return data or ""
    except Exception as e:
        print(f"[QR decode error] url={image_url[:60]} err={e}")
        return ""


def _fetch_qr_image_url(rz_client, qr_id: str) -> str:
    """Fetch QR code from Razorpay API to get the direct CDN image URL
    (the create response returns a rzp.io short URL which may not resolve on server).
    """
    try:
        qr_full = rz_client.qrcode.fetch(qr_id)
        return qr_full.get("image_url", "")
    except Exception as e:
        print(f"[QR fetch error] {e}")
        return ""


# ── Internal helper ───────────────────────────────────────────────────────────

def _finalise_rsvp(*, order_id: str, event_id: str, uid: str, payment_id: str, wallet_amount: int):  # noqa: E501
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


# ── GET /payments/saved-upi-id ────────────────────────────────────────────────

@router.get("/saved-upi-id")
def get_saved_upi(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            "SELECT upi_id, name FROM saved_upi_ids WHERE user_id = %s::uuid ORDER BY created_at DESC LIMIT 1",
            (uid,),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"upi_id": row["upi_id"], "name": row["name"]}


# ── POST /payments/save-upi-id ────────────────────────────────────────────────

@router.post("/save-upi-id")
def save_upi(body: SaveUpiBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO saved_upi_ids (user_id, upi_id, name)
            VALUES (%s::uuid, %s, %s)
            ON CONFLICT (user_id, upi_id) DO UPDATE SET name = EXCLUDED.name
            """,
            (uid, body.upi_id, body.name),
        )
        conn.commit()
    return {"ok": True}


# ── POST /payments/create-qr ──────────────────────────────────────────────────

@router.post("/create-qr")
def create_qr(body: CreateQrBody, current_user: dict = Depends(get_current_user)):
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
    wallet_use = max(0, min(body.wallet_amount, wallet_bal, total))
    charge = total - wallet_use

    if charge <= 0:
        raise HTTPException(status_code=400, detail="Use wallet-pay for full wallet payment")

    close_by = int(time.time()) + 900  # 15 minutes
    rz = _get_rz()
    qr = rz.qrcode.create({
        "type": "upi_qr",
        "name": "Vybe",
        "usage": "single_use",
        "fixed_amount": True,
        "payment_amount": charge * 100,
        "description": f"Ticket — {ev['title']}",
        "close_by": close_by,
    })

    image_url = qr.get("image_url", "")
    qr_id = qr["id"]

    # Razorpay live API doesn't return payment_url — decode the QR image ourselves.
    # The create response gives a rzp.io short URL which may fail on server DNS.
    # Fetching by ID from api.razorpay.com returns the direct CDN URL instead.
    payment_url = qr.get("payment_url") or qr.get("link") or qr.get("short_url") or ""
    if not payment_url:
        decode_url = image_url
        if "rzp.io" in image_url:
            # Short URL won't resolve on server — get direct CDN URL via API fetch
            cdn_url = _fetch_qr_image_url(rz, qr_id)
            if cdn_url and "rzp.io" not in cdn_url:
                decode_url = cdn_url
                image_url = cdn_url  # use the direct CDN URL everywhere
        payment_url = _decode_qr_image(decode_url)
    print(f"[QR] id={qr_id} image_url={image_url[:60]} payment_url={payment_url[:80] if payment_url else 'EMPTY'}")

    expires_at = datetime.fromtimestamp(qr["close_by"], tz=timezone.utc)

    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO payment_orders
                (user_id, event_id, qr_code_id, qr_image_url, qr_expires_at,
                 amount_inr, wallet_amount_inr, razorpay_amount_inr)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s, %s, %s)
            """,
            (uid, body.event_id, qr_id, image_url,
             expires_at, total, wallet_use, charge),
        )
        conn.commit()

    return {
        "qr_id": qr["id"],
        "image_url": image_url,
        "payment_url": payment_url,
        "amount_inr": total,
        "expires_at": expires_at.isoformat(),
    }


# ── GET /payments/qr-status/{qr_id} ──────────────────────────────────────────

@router.get("/qr-status/{qr_id}")
def get_qr_status(qr_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]

    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT id::text, status, event_id::text, wallet_amount_inr, qr_expires_at
            FROM payment_orders
            WHERE qr_code_id = %s AND user_id = %s::uuid
            """,
            (qr_id, uid),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="QR not found")

    if row["status"] == "paid":
        return {"status": "paid"}

    now = datetime.now(timezone.utc)
    expires_at = row["qr_expires_at"]
    if expires_at and now > expires_at:
        return {"status": "expired"}

    rz = _get_rz()
    try:
        payments_resp = rz.qrcode.fetch_all_payments(qr_id)
        items = payments_resp.get("items", [])
    except Exception:
        return {"status": "pending"}

    captured = next((p for p in items if p.get("status") == "captured"), None)
    if not captured:
        return {"status": "pending"}

    _finalise_qr_rsvp(
        order_db_id=row["id"],
        qr_code_id=qr_id,
        event_id=row["event_id"],
        uid=uid,
        payment_id=captured["id"],
        wallet_amount=row["wallet_amount_inr"],
    )
    return {"status": "paid"}


# ── Internal helper — QR finalise ─────────────────────────────────────────────

def _finalise_qr_rsvp(*, order_db_id: str, qr_code_id: str, event_id: str,
                       uid: str, payment_id: str, wallet_amount: int):
    from utils.push import send_push  # local import to avoid circular

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
                VALUES (%s::uuid, %s, 'debit', 'ticket_purchase', %s::uuid, 'Wallet used for QR ticket')
                """,
                (uid, wallet_amount, event_id),
            )
        cur.execute(
            "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = %s WHERE id = %s::uuid",
            (payment_id, order_db_id),
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

    try:
        send_push(uid, "Payment confirmed!", "Your ticket is ready. 🎉",
                  {"type": "payment_success", "event_id": event_id})
    except Exception:
        pass

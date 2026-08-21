from typing import List
from fastapi import APIRouter, HTTPException, Depends

from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit
from db.config import get_db
from schemas.safety import EmergencyContactCreate, EmergencyContactResponse, SosRequest, SosResponse
from utils.twilio_client import send_sms

router = APIRouter(prefix="/safety", tags=["safety"])

# Uber caps its emergency-contact list at 5 — enough for close family/friends
# without turning the SOS alert into a mailing list. Enforced here (not just
# client-side) since this is the source of truth other clients could hit too.
MAX_EMERGENCY_CONTACTS = 5


@router.get("/emergency-contacts", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT id::text, name, phone, emoji, source, created_at::text
            FROM emergency_contacts
            WHERE user_id = %s::uuid
            ORDER BY created_at ASC
            """,
            (current_user["id"],),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@router.post("/emergency-contacts", response_model=EmergencyContactResponse, status_code=201)
def add_emergency_contact(body: EmergencyContactCreate, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute("SELECT COUNT(*) AS n FROM emergency_contacts WHERE user_id = %s::uuid", (uid,))
        if cur.fetchone()["n"] >= MAX_EMERGENCY_CONTACTS:
            raise HTTPException(status_code=400, detail=f"You can add up to {MAX_EMERGENCY_CONTACTS} emergency contacts")
        cur.execute(
            "SELECT id FROM emergency_contacts WHERE user_id = %s::uuid AND phone = %s",
            (uid, body.phone),
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="This number is already an emergency contact")
        cur.execute(
            """
            INSERT INTO emergency_contacts (user_id, name, phone, emoji, source)
            VALUES (%s::uuid, %s, %s, %s, %s)
            RETURNING id::text, name, phone, emoji, source, created_at::text
            """,
            (uid, body.name, body.phone, body.emoji, body.source),
        )
        row = cur.fetchone()
    return dict(row)


@router.delete("/emergency-contacts/{contact_id}")
def remove_emergency_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            "DELETE FROM emergency_contacts WHERE id = %s::uuid AND user_id = %s::uuid",
            (contact_id, current_user["id"]),
        )
    return {"ok": True}


# ── SOS ────────────────────────────────────────────────────────────────────────
# Triggered from the confirm sheet on the event detail screen. Texts every
# emergency contact a Google Maps link to the user's current location — kept
# to a plain SMS (not push/in-app) since a contact needs to see this even if
# they don't have Gorave installed.

@router.post("/sos", response_model=SosResponse)
def trigger_sos(body: SosRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    # Generous cap (not a hard single-shot lock) — a real emergency can mean
    # tapping SOS more than once, but this stops runaway/accidental spam.
    enforce_rate_limit(f"safety:sos:user:{uid}", max_events=3, window_seconds=3600,
                        message="SOS was already sent recently. If this is still an emergency, call for help directly.")

    with get_db() as (cur, _):
        cur.execute("SELECT name, phone FROM emergency_contacts WHERE user_id = %s::uuid", (uid,))
        contacts = cur.fetchall()
        if not contacts:
            raise HTTPException(status_code=400, detail="Add an emergency contact before sending SOS")

        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        user_row = cur.fetchone()
        user_name = (user_row["name"] if user_row else None) or "A Gorave user"

        event_title = None
        if body.event_id:
            cur.execute("SELECT title FROM events WHERE id = %s::uuid", (body.event_id,))
            event_row = cur.fetchone()
            if event_row:
                event_title = event_row["title"]

    maps_link = f"https://maps.google.com/?q={body.lat},{body.lng}"
    context = f" at {event_title}" if event_title else ""
    message = (
        f"🚨 SOS from {user_name} via Gorave: I may need assistance{context}. "
        f"My current location: {maps_link}"
    )

    alerted = sum(1 for c in contacts if send_sms(c["phone"], message))
    return {"ok": True, "alerted": alerted}

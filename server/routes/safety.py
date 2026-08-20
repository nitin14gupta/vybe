from typing import List
from fastapi import APIRouter, HTTPException, Depends

from middleware.auth import get_current_user
from db.config import get_db
from schemas.safety import EmergencyContactCreate, EmergencyContactResponse

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
            """
            INSERT INTO emergency_contacts (user_id, name, phone, emoji, source)
            VALUES (%s::uuid, %s, %s, %s, %s)
            ON CONFLICT (user_id, phone) DO UPDATE SET name = EXCLUDED.name, emoji = EXCLUDED.emoji
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

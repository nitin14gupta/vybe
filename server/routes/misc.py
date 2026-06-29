from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(tags=["misc"])


class FeedbackBody(BaseModel):
    text: str


class SupportBody(BaseModel):
    topic: str
    message: str


@router.post("/feedback", status_code=201)
def submit_feedback(body: FeedbackBody, current_user: dict = Depends(get_current_user)):
    if not body.text.strip():
        return {"ok": False}
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO app_feedback (user_id, text, created_at)
            VALUES (%s::uuid, %s, NOW())
            """,
            (uid, body.text.strip()),
        )
        conn.commit()
    return {"ok": True}


@router.post("/support", status_code=201)
def submit_support(body: SupportBody, current_user: dict = Depends(get_current_user)):
    if not body.message.strip():
        return {"ok": False}
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO support_requests (user_id, topic, message, created_at)
            VALUES (%s::uuid, %s, %s, NOW())
            """,
            (uid, body.topic, body.message.strip()),
        )
        conn.commit()
    return {"ok": True}

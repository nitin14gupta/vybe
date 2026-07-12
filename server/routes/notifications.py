from fastapi import APIRouter, Depends, Query
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _insert_notification(cur, user_id: str, type_: str, title: str, body: Optional[str] = None,
                          actor_id: Optional[str] = None, entity_id: Optional[str] = None,
                          entity_type: Optional[str] = None):
    cur.execute(
        """
        INSERT INTO notifications (user_id, type, actor_id, entity_id, entity_type, title, body)
        VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, type_, actor_id, entity_id, entity_type, title, body),
    )


def notify_followers_event_created(cur, host_id: str, event_id: str, event_title: str, host_name: str):
    cur.execute(
        "SELECT follower_id::text FROM follows WHERE following_id = %s::uuid",
        (host_id,),
    )
    follower_ids = [r["follower_id"] for r in cur.fetchall()]
    for fid in follower_ids:
        _insert_notification(
            cur, fid, "event_created",
            title=f"{host_name} just posted an event",
            body=event_title,
            actor_id=host_id,
            entity_id=event_id,
            entity_type="event",
        )


def notify_vybe_accepted(cur, requester_id: str, accepter_id: str, accepter_name: str):
    _insert_notification(
        cur, requester_id, "vybe_accepted",
        title=f"{accepter_name} accepted your Vybe!",
        actor_id=accepter_id,
        entity_id=accepter_id,
        entity_type="user",
    )


def notify_vybe_request(cur, receiver_id: str, sender_id: str, sender_name: str):
    _insert_notification(
        cur, receiver_id, "vybe_request",
        title=f"{sender_name} sent you a Vybe!",
        actor_id=sender_id,
        entity_id=sender_id,
        entity_type="user",
    )


def notify_new_follower(cur, followee_id: str, follower_id: str, follower_name: str):
    _insert_notification(
        cur, followee_id, "new_follower",
        title=f"{follower_name} started following you",
        actor_id=follower_id,
        entity_id=follower_id,
        entity_type="user",
    )


def notify_event_created(cur, host_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, host_id, "event_created_confirmation",
        title="Your event is live!",
        body=f"{event_title} was posted successfully.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_event_cancelled_attendee(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "event_cancelled",
        title="Event cancelled",
        body=f"{event_title} was cancelled by the host.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_new_review(cur, host_id: str, event_id: str, event_title: str, reviewer_id: str, reviewer_name: str, rating: int):
    _insert_notification(
        cur, host_id, "event_review",
        title=f"{reviewer_name} left a {rating}-star review",
        body=event_title,
        actor_id=reviewer_id,
        entity_id=event_id,
        entity_type="event",
    )


def notify_payment_confirmed(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "payment_confirmed",
        title="Payment confirmed!",
        body=f"Your ticket for {event_title} is ready.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_report_submitted(cur, reporter_id: str, entity_type: str, entity_id: Optional[str] = None):
    _insert_notification(
        cur, reporter_id, "report_submitted",
        title="Report submitted",
        body="Thanks for letting us know — our team will review it shortly.",
        entity_id=entity_id,
        entity_type=entity_type,
    )


def notify_event_updated(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "event_updated",
        title="Event details changed",
        body=f"The host updated {event_title}. Check what's new.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_event_sold_out(cur, host_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, host_id, "event_sold_out",
        title="Your event sold out!",
        body=f"{event_title} has no spots left.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_ticket_sold(cur, host_id: str, event_id: str, event_title: str, buyer_id: str, buyer_name: str):
    _insert_notification(
        cur, host_id, "ticket_sold",
        title=f"{buyer_name} bought a ticket!",
        body=f"Someone's going to {event_title}.",
        actor_id=buyer_id,
        entity_id=event_id,
        entity_type="event",
    )


def notify_event_rsvp(cur, host_id: str, attendee_id: str, attendee_name: str, event_id: str, event_title: str):
    _insert_notification(
        cur, host_id, "event_rsvp",
        title=f"{attendee_name} is going to {event_title}",
        actor_id=attendee_id,
        entity_id=event_id,
        entity_type="event",
    )


def notify_waitlist_promoted(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "waitlist_promoted",
        title="A spot opened up!",
        body=f"You have 1 hours to confirm your spot at {event_title}.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_waitlist_expired(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "waitlist_expired",
        title="Spot offer expired",
        body=f"Your reserved spot at {event_title} was given to the next person.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_waitlist_event_cancelled(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "waitlist_event_cancelled",
        title="Event cancelled",
        body=f"{event_title} was cancelled. You've been removed from the waitlist.",
        entity_id=event_id,
        entity_type="event",
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
def list_notifications(
    before: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(10, le=50),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, _):
        conditions = ["n.user_id = %s::uuid"]
        params: list = [uid]

        if before:
            conditions.append("n.created_at < %s")
            params.append(before)

        if unread_only:
            conditions.append("n.read_at IS NULL")

        where = " AND ".join(conditions)

        cur.execute(
            f"""
            SELECT
                n.id::text,
                n.type,
                n.actor_id::text,
                u.name AS actor_name,
                (SELECT url FROM user_photos WHERE user_id = n.actor_id ORDER BY position LIMIT 1) AS actor_avatar,
                n.entity_id::text,
                n.entity_type,
                n.title,
                n.body,
                n.read_at,
                n.created_at
            FROM notifications n
            LEFT JOIN users u ON u.id = n.actor_id
            WHERE {where}
            ORDER BY n.created_at DESC
            LIMIT %s
            """,
            params + [limit],
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@router.patch("/read-all", status_code=200)
def mark_all_read(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE notifications SET read_at = NOW() WHERE user_id = %s::uuid AND read_at IS NULL",
            (current_user["id"],),
        )
        conn.commit()
    return {"ok": True}


@router.patch("/{notif_id}/read", status_code=200)
def mark_one_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE notifications SET read_at = NOW() WHERE id = %s::uuid AND user_id = %s::uuid AND read_at IS NULL",
            (notif_id, current_user["id"]),
        )
        conn.commit()
    return {"ok": True}

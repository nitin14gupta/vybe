import json
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db
from utils.push import NOTIF_CATEGORIES

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


def notify_vibe_accepted(cur, requester_id: str, accepter_id: str, accepter_name: str):
    _insert_notification(
        cur, requester_id, "vibe_accepted",
        title=f"{accepter_name} accepted your Vibe!",
        actor_id=accepter_id,
        entity_id=accepter_id,
        entity_type="user",
    )


def notify_vibe_request(cur, receiver_id: str, sender_id: str, sender_name: str):
    _insert_notification(
        cur, receiver_id, "vibe_request",
        title=f"{sender_name} sent you a Vibe!",
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


def notify_host_onboarding_complete(cur, user_id: str):
    """actor_id is set to the user themselves so the notification list's
    existing actor_avatar join surfaces their own profile photo instead of
    a static icon — same pattern as notify_host_badge_earned below."""
    _insert_notification(
        cur, user_id, "host_onboarding_complete",
        title="You're all set to host!",
        body="Your payout details are saved — go ahead and create your first event.",
        actor_id=user_id,
        entity_type="user",
        entity_id=user_id,
    )


HOST_BADGE_COPY = {
    "Rising": ("You're a Rising Host now! \U0001f31f", "Keep it up — more hosted events means more visibility for your next one."),
    "Established": ("You're an Established Host!", "Your track record is showing — expect more reach in Discover and Trending."),
    "Elite": ("You're an Elite Host!", "Top-tier hosting, unlocked. Your events now get priority placement."),
    "Legend": ("You're a Legend Host! \U0001f451", "75+ events hosted. Maximum visibility across Discover and Trending — nice work."),
}


def notify_host_badge_earned(cur, user_id: str, badge_name: str):
    """Fired when a host's hosted-event count crosses a new badge tier
    (see routes.users.compute_host_badges) — actor_id is set to the host
    themselves so the notification list's existing actor_avatar join
    surfaces their own profile photo, no separate image plumbing needed."""
    title, body = HOST_BADGE_COPY.get(badge_name, (f"You're a {badge_name} Host now!", None))
    _insert_notification(
        cur, user_id, "host_badge_earned",
        title=title,
        body=body,
        actor_id=user_id,
        entity_id=user_id,
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


# Fixed early milestones (fast, frequent wins while a host is building trust),
# then every 50 after 100 (spaced out further since a big host racks up
# reviews quickly and a notif every single multiple of 5/10 would be spammy).
REVIEW_MILESTONES = (5, 10, 25, 50, 100)


def review_milestone_reached(review_count: int) -> Optional[int]:
    """review_count only ever increases by 1 per call site (one review per
    submission, duplicates blocked before insert), so a plain membership/
    modulo check is enough — no need to scan a range for skipped milestones."""
    if review_count in REVIEW_MILESTONES:
        return review_count
    if review_count > REVIEW_MILESTONES[-1] and review_count % 50 == 0:
        return review_count
    return None


def notify_review_milestone(cur, host_id: str, milestone: int, avg_rating: float):
    _insert_notification(
        cur, host_id, "review_milestone",
        title=f"{milestone} reviews and {avg_rating}★ average!",
        body="Your reputation is building — attendees are loving what you host. Keep it up for more visibility.",
        actor_id=host_id,
        entity_id=host_id,
        entity_type="user",
    )


def notify_payment_confirmed(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "payment_confirmed",
        title="Payment confirmed!",
        body=f"Your ticket for {event_title} is ready.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_rsvp_confirmed(cur, user_id: str, event_id: str, event_title: str):
    """Free-RSVP counterpart to notify_payment_confirmed above — paid tickets
    already got a self-confirmation, free ones never did. Same tap target
    (the ticket screen), just no money changed hands."""
    _insert_notification(
        cur, user_id, "rsvp_confirmed",
        title="You're going! \U0001f389",
        body=f"Your ticket for {event_title} is ready — tap to view it.",
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
        body=f"You have 1 hour to confirm your spot at {event_title}.",
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


def notify_event_cancelled_host(cur, host_id: str, event_id: str, event_title: str, by_admin: bool = False):
    body = (
        f"{event_title} was cancelled by the Gorave team. Attendees have been refunded."
        if by_admin else
        f"You cancelled {event_title}. Attendees have been notified and refunded."
    )
    _insert_notification(
        cur, host_id, "event_cancelled_host",
        title="Event cancelled",
        body=body,
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


# ── New engagement notifications (reactive only — the scheduled ones
# (event-starting-soon, payout-coming-soon, wallet-expiring, birthday,
# re-engagement) were removed along with the scheduler loop in main.py;
# revisit when a proper scheduler, e.g. Celery Beat, replaces it) ──────────────

def notify_checked_in(cur, user_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, user_id, "checked_in",
        title="You're checked in! \U0001f389",
        body=f"Enjoy {event_title}.",
        entity_id=event_id,
        entity_type="event",
    )


def notify_follow_rsvp(cur, follower_id: str, actor_id: str, actor_name: str, event_id: str, event_title: str):
    """Fired only to followers who are ALSO already going to event_id — see
    callers in routes/events.py and routes/payments.py."""
    _insert_notification(
        cur, follower_id, "follow_rsvp",
        title=f"{actor_name} is going to {event_title} too",
        body="Someone you follow just joined an event you're already going to.",
        actor_id=actor_id,
        entity_id=event_id,
        entity_type="event",
    )


def notify_host_low_capacity(cur, host_id: str, event_id: str, event_title: str, reason: str):
    """reason: 'almost_sold_out' | 'waitlist_forming' — same notification
    shape, different nudge copy for whichever threshold tripped first."""
    if reason == "waitlist_forming":
        title = "People are waitlisting for your event"
        body = f"{event_title} has a growing waitlist — consider raising capacity."
    else:
        title = "Your event is almost sold out!"
        body = f"{event_title} is almost full — raise capacity to let more people in."
    _insert_notification(
        cur, host_id, "host_low_capacity",
        title=title,
        body=body,
        entity_id=event_id,
        entity_type="event",
    )


def notify_first_event_hosted(cur, host_id: str, event_id: str, event_title: str):
    _insert_notification(
        cur, host_id, "first_event_hosted",
        title="You're officially a host! \U0001f973",
        body=f"{event_title} is your first event — nice work.",
        actor_id=host_id,
        entity_id=event_id,
        entity_type="event",
    )


# ── Action-button enrichment ───────────────────────────────────────────────────
# Attaches an actionable next-step to certain notification types so the list
# doesn't just inform — it lets you act (follow back, send a vibe, message).

def _get_active_conversation_id(cur, uid_a: str, uid_b: str) -> Optional[str]:
    u1, u2 = (uid_a, uid_b) if uid_a < uid_b else (uid_b, uid_a)
    cur.execute(
        "SELECT id::text FROM conversations WHERE user1_id = %s::uuid AND user2_id = %s::uuid AND status = 'active'",
        (u1, u2),
    )
    row = cur.fetchone()
    return row["id"] if row else None


def _extract_cover_photo(cover_photos) -> Optional[str]:
    if not cover_photos:
        return None
    first = cover_photos[0]
    if isinstance(first, str):
        return first
    if isinstance(first, dict):
        return first.get("url")
    return None


def _is_following(cur, follower_id: str, following_id: str) -> bool:
    cur.execute(
        "SELECT 1 FROM follows WHERE follower_id = %s::uuid AND following_id = %s::uuid",
        (follower_id, following_id),
    )
    return cur.fetchone() is not None


def _enrich_notification(cur, uid: str, row: dict) -> dict:
    d = dict(row)
    d["action"] = None
    d["action_label"] = None
    d["action_target_id"] = None
    d["cover_photo"] = None

    ntype = d["type"]
    actor_id = d.get("actor_id")

    if ntype == "vibe_request" and actor_id:
        if not _is_following(cur, uid, actor_id):
            they_follow_me = _is_following(cur, actor_id, uid)
            d["action"] = "follow"
            d["action_label"] = "Follow Back" if they_follow_me else "Follow"
            d["action_target_id"] = actor_id

    elif ntype == "vibe_accepted" and actor_id:
        conv_id = _get_active_conversation_id(cur, uid, actor_id)
        if conv_id:
            d["action"] = "message"
            d["action_label"] = "Message"
            d["action_target_id"] = conv_id

    elif ntype == "new_follower" and actor_id:
        if not _is_following(cur, uid, actor_id):
            d["action"] = "follow"
            d["action_label"] = "Follow Back"
            d["action_target_id"] = actor_id
        else:
            cur.execute(
                """
                SELECT status FROM vibe_requests
                WHERE (sender_id = %s::uuid AND receiver_id = %s::uuid)
                   OR (sender_id = %s::uuid AND receiver_id = %s::uuid)
                ORDER BY created_at DESC LIMIT 1
                """,
                (uid, actor_id, actor_id, uid),
            )
            vr = cur.fetchone()
            if vr and vr["status"] == "accepted":
                conv_id = _get_active_conversation_id(cur, uid, actor_id)
                if conv_id:
                    d["action"] = "message"
                    d["action_label"] = "Message"
                    d["action_target_id"] = conv_id
            elif not vr or vr["status"] not in ("pending",):
                d["action"] = "send_vibe"
                d["action_label"] = "Send Vibe"
                d["action_target_id"] = actor_id
            # else: pending vibe between the two — ambiguous, no button

    if d.get("entity_type") == "event" and d.get("entity_id"):
        cur.execute("SELECT cover_photos FROM events WHERE id = %s", (d["entity_id"],))
        ev = cur.fetchone()
        if ev:
            d["cover_photo"] = _extract_cover_photo(ev["cover_photos"])

    return d


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
        conditions = ["n.user_id = %s::uuid", "n.dismissed_at IS NULL"]
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
        return [_enrich_notification(cur, uid, r) for r in rows]


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


@router.delete("/{notif_id}", status_code=200)
def dismiss_notification(notif_id: str, current_user: dict = Depends(get_current_user)):
    """Swipe-to-dismiss — the user never wants to see this one again. Soft
    delete (dismissed_at) rather than a hard DELETE so it stays available for
    any future audit/debugging without cluttering the user's own list."""
    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE notifications
            SET dismissed_at = NOW(), read_at = COALESCE(read_at, NOW())
            WHERE id = %s::uuid AND user_id = %s::uuid AND dismissed_at IS NULL
            """,
            (notif_id, current_user["id"]),
        )
        conn.commit()
    return {"ok": True}


# ── Push notification category preferences ────────────────────────────────────
# Controls PUSH delivery only (see utils/push.py's category gate) — the
# in-app notification list above is unaffected, so cancelling/toggling never
# hides something the user already relied on seeing in-app.

class NotificationPrefsBody(BaseModel):
    social: Optional[bool] = None
    hosting: Optional[bool] = None
    attending: Optional[bool] = None
    payments: Optional[bool] = None


@router.get("/preferences")
def get_notification_prefs(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute("SELECT notification_prefs FROM users WHERE id = %s::uuid", (current_user["id"],))
        row = cur.fetchone()
    stored = (row["notification_prefs"] if row else None) or {}
    return {cat: stored.get(cat, True) is not False for cat in NOTIF_CATEGORIES}


@router.patch("/preferences")
def update_notification_prefs(body: NotificationPrefsBody, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE users SET notification_prefs = notification_prefs || %s::jsonb WHERE id = %s::uuid "
            "RETURNING notification_prefs",
            (json.dumps(updates), current_user["id"]),
        )
        row = cur.fetchone()
        conn.commit()
    stored = row["notification_prefs"] if row else {}
    return {cat: stored.get(cat, True) is not False for cat in NOTIF_CATEGORIES}

"""
One-off local-dev seed script — populates chat + hosting test data around ONE
specific real user (not a demo account), so you can test the chat unread
badge, conversation list, and event-hosting flows without hand-creating data:

  - 14 fresh demo "buddy" users, each with an accepted vybe + active
    conversation with the target user, and 4-5 unread messages sent TO the
    target (read_at left NULL — drives the chat tab's unread badge).
  - 5 events hosted by the target user in Mumbai (mix of free + paid).
  - 10-12 of the demo buddies RSVP 'going' to each event (mix of free/paid
    joins — paid joins get a fake payment_id so paid-attendee logic sees
    them as paid).
  - 5 unread in-app notifications (new_follower, vybe_accepted, ticket_sold,
    event_review, event_rsvp) — tests the Home header's notification badge
    and its pop-on-new-arrival animation.

Does NOT touch the target user's own row besides flipping
is_host_onboarding_finished on if it's off (needed to host events).
Safe to re-run: wipes only the buddy users it previously created (tracked by
DEMO_PHONE_PREFIX) before reseeding — never touches the target account.

Run with:  server/venv/Scripts/python.exe server/scripts/seed_chat_for_user.py
"""
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.config import get_db  # noqa: E402

random.seed(7)

TARGET_USER_ID = "6e0db5a8-2836-40d4-b9cb-8c0a66146bf2"
DEMO_PHONE_PREFIX = "93000000"  # +91 93000000XX — distinct from seed_demo.py's 90000000 range

NUM_BUDDIES = 14
NUM_EVENTS = 5

MUMBAI = {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777}

UNSPLASH = [
    "https://images.unsplash.com/photo-1773332611476-6ec2ba68049f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://plus.unsplash.com/premium_photo-1683129807314-95150b5c3fb1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774637777045-e7390fc657e8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1765003291278-495489d2d7fe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774270905958-86e7eaeae23d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774538537377-9646fa0ec25a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775563623211-4ecef6718f1f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774966961772-c73ad3a60b10?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775385015053-3e4aad001e22?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775533222841-095c4e19ceaf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775419044790-98d1f54699db?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775348437069-0f2d58a180ee?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775214593108-5d577e88d219?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774444487684-a796af0c2841?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774725801222-51a94a1f4719?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774637184972-6a12518f12f0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775544265981-9db0ea58687f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775315721849-69c9e9926c85?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
]


def img(i: int) -> str:
    return UNSPLASH[i % len(UNSPLASH)]


FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Krishna", "Ishaan", "Reyansh", "Arjun", "Kabir",
    "Ananya", "Diya", "Saanvi", "Myra", "Anika", "Kiara", "Aadhya", "Zara",
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Reddy", "Iyer", "Nair", "Kapoor", "Malhotra",
    "Chopra", "Bhatt", "Rao", "Mehta", "Singh", "Joshi",
]
BIOS = [
    "Here for the food and the vibes, mostly the food.",
    "Trying to say yes to more things this year.",
    "Music, weekend plans, and overthinking group chats.",
    "New to the city, still figuring out where the good spots are.",
    "Will show up for literally any rooftop event.",
]
GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"]
INTERESTS = [
    "Music", "Travel", "Food", "Sports", "Art", "Movies", "Gaming", "Dance",
    "Fitness", "Comedy", "Photography", "Nightlife",
]
EVENT_TYPES = ["house_party", "rooftop", "game_night", "dinner", "music"]
EVENT_TITLES = {
    "house_party": "Terrace Vibes",
    "rooftop": "Sunset Rooftop Mixer",
    "game_night": "Game Night Squad",
    "dinner": "Long Table Dinner",
    "music": "Indie Jam Night",
}
MSG_OPENERS = [
    "hey! saw you're also into {interest}, small world",
    "hii, excited for the event this weekend?",
    "yo what's up, you going to any events soon?",
    "hey! love your profile, are you around this weekend?",
    "heyy just matched, what's good",
]
MSG_FOLLOWUPS = [
    "btw are you coming to anything this week?",
    "this app is actually pretty fun ngl",
    "let me know if you're free this weekend",
    "what kind of events are you usually into?",
    "haha yeah same, still figuring the city out",
    "any good spots you'd recommend?",
]


def rand_dob(min_age=19, max_age=30):
    today = datetime.now(timezone.utc).date()
    age = random.randint(min_age, max_age)
    return today.replace(year=today.year - age) - timedelta(days=random.randint(0, 364))


def jitter(v, spread=0.03):
    return round(v + random.uniform(-spread, spread), 6)


def wipe_existing(cur):
    cur.execute("SELECT id FROM users WHERE phone LIKE %s", (DEMO_PHONE_PREFIX + "%",))
    ids = [r["id"] for r in cur.fetchall()]
    if not ids:
        return
    cur.execute("DELETE FROM users WHERE id = ANY(%s::uuid[])", ([str(i) for i in ids],))
    print(f"Wiped {len(ids)} previously-seeded buddy users (cascades cover their vybes/messages/etc.)")


def main():
    with get_db() as (cur, conn):
        cur.execute("SELECT id, name FROM users WHERE id = %s", (TARGET_USER_ID,))
        target = cur.fetchone()
        if not target:
            print(f"No user found with id {TARGET_USER_ID} — aborting.")
            return
        print(f"Target user: {target['name']} ({TARGET_USER_ID})")

        wipe_existing(cur)

        cur.execute(
            "UPDATE users SET is_host_onboarding_finished = TRUE WHERE id = %s AND COALESCE(is_host_onboarding_finished, FALSE) = FALSE",
            (TARGET_USER_ID,),
        )

        now = datetime.now(timezone.utc)

        # ── 14 buddy users ────────────────────────────────────────────────
        buddy_ids = []
        buddy_names = {}
        for i in range(NUM_BUDDIES):
            uid = str(uuid.uuid4())
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            last = LAST_NAMES[i % len(LAST_NAMES)]
            name = f"{first} {last}"
            username = f"{first.lower()}{last.lower()}{i}seed"
            phone = f"{DEMO_PHONE_PREFIX}{i:02d}"
            my_interests = random.sample(INTERESTS, k=random.randint(3, 4))

            cur.execute(
                """
                INSERT INTO users (
                    id, phone, country_code, name, dob, gender, city, lat, lng,
                    interests, profile_complete, bio, username, is_host_onboarding_finished
                ) VALUES (%s, %s, '+91', %s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s, FALSE)
                """,
                (
                    uid, phone, name, rand_dob(), random.choice(GENDERS), MUMBAI["name"],
                    jitter(MUMBAI["lat"]), jitter(MUMBAI["lng"]), my_interests,
                    random.choice(BIOS), username,
                ),
            )
            for pos in range(2):
                cur.execute(
                    "INSERT INTO user_photos (user_id, url, r2_path, position) VALUES (%s, %s, %s, %s)",
                    (uid, img(i * 2 + pos), f"seed-chat/{uid}-{pos}.jpg", pos),
                )
            buddy_ids.append(uid)
            buddy_names[uid] = name
        print(f"Created {len(buddy_ids)} buddy users")

        # ── Accepted vybe + active conversation + 4-5 unread messages,
        #    all sent TO the target ──────────────────────────────────────
        for i, buddy_id in enumerate(buddy_ids):
            cur.execute(
                """
                INSERT INTO vibe_requests (sender_id, receiver_id, message, status)
                VALUES (%s, %s, %s, 'accepted')
                RETURNING id
                """,
                (buddy_id, TARGET_USER_ID, MSG_OPENERS[i % len(MSG_OPENERS)].format(interest=random.choice(INTERESTS))),
            )
            vybe_id = cur.fetchone()["id"]

            u1, u2 = sorted((buddy_id, TARGET_USER_ID))
            last_at = now - timedelta(minutes=random.randint(5, 600))
            cur.execute(
                """
                INSERT INTO conversations (user1_id, user2_id, vybe_request_id, status, last_message_at)
                VALUES (%s, %s, %s, 'active', %s) RETURNING id
                """,
                (u1, u2, vybe_id, last_at),
            )
            conv_id = cur.fetchone()["id"]

            msg_count = random.randint(4, 5)
            thread = [MSG_OPENERS[i % len(MSG_OPENERS)].format(interest=random.choice(INTERESTS))]
            thread += random.sample(MSG_FOLLOWUPS, k=msg_count - 1)
            t = last_at - timedelta(minutes=msg_count * 5)
            for body in thread:
                t += timedelta(minutes=random.randint(2, 6))
                cur.execute(
                    """
                    INSERT INTO messages (conversation_id, sender_id, content, sent_at, read_at)
                    VALUES (%s, %s, %s, %s, NULL)
                    """,
                    (conv_id, buddy_id, body, t),
                )
            # last_message_at should land on the actual final message
            cur.execute("UPDATE conversations SET last_message_at = %s WHERE id = %s", (t, conv_id))
        print(f"Created {len(buddy_ids)} accepted vybes + active conversations, {NUM_BUDDIES}x4-5 unread messages sent to the target")

        # ── 5 events hosted by target, Mumbai, mix of free/paid ─────────
        event_ids = []
        for e in range(NUM_EVENTS):
            etype = EVENT_TYPES[e % len(EVENT_TYPES)]
            title = EVENT_TITLES[etype]
            date_time = now + timedelta(days=random.randint(3, 21))
            end_time = date_time + timedelta(hours=random.choice([2, 3, 4]))
            is_free = e % 2 == 0  # alternate — guarantees both free and paid in a 5-event set
            price = 0 if is_free else random.choice([149, 199, 299, 499])
            fee, commission, profit = (0, 0, 0) if is_free else (50, round(price * 0.10), 50 + round(price * 0.10))
            capacity = random.randint(18, 24)
            eid = str(uuid.uuid4())
            covers = [img(e * 2), img(e * 2 + 1)]

            cur.execute(
                """
                INSERT INTO events (
                    id, host_id, title, description, rules, event_type, date_time, end_time,
                    capacity, spots_left, age_restriction, location_name, location_lat, location_lng,
                    price_inr, cover_photos, is_published, platform_fee_inr, host_commission_inr,
                    platform_profit_inr, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 18, %s, %s, %s, %s, %s::jsonb, TRUE, %s, %s, %s, %s)
                """,
                (
                    eid, TARGET_USER_ID, title,
                    f"{title} — good music, good people, come through and vibe with us.",
                    "Be respectful, be on time, and bring good energy.",
                    etype, date_time, end_time, capacity, capacity,
                    f"{MUMBAI['name']}, India", jitter(MUMBAI["lat"]), jitter(MUMBAI["lng"]),
                    price, json.dumps(covers), fee, commission, profit,
                    now,
                ),
            )
            event_ids.append(eid)

            # ── 10-12 buddies RSVP going — paid events get a fake payment_id ──
            attendees = random.sample(buddy_ids, k=min(random.randint(10, 12), len(buddy_ids)))
            for a in attendees:
                payment_id = f"seed_pay_{uuid.uuid4().hex[:16]}" if not is_free else None
                cur.execute(
                    """
                    INSERT INTO event_attendees (event_id, user_id, status, joined_at, payment_id)
                    VALUES (%s, %s, 'going', %s, %s)
                    """,
                    (eid, a, date_time - timedelta(days=random.randint(1, 8)), payment_id),
                )
            cur.execute(
                "UPDATE events SET spots_left = spots_left - %s WHERE id = %s",
                (len(attendees), eid),
            )
            print(f"  Event '{title}' ({'free' if is_free else f'Rs {price}'}) - {len(attendees)} going")

        print(f"Created {len(event_ids)} events hosted by target in Mumbai")

        # ── 5 unread in-app notifications, same shapes routes/notifications.py
        #    actually produces — tests the header's notification pop badge ────
        notif_actors = random.sample(buddy_ids, k=min(5, len(buddy_ids)))
        notif_rows = [
            (
                "new_follower", notif_actors[0], notif_actors[0], "user",
                f"{buddy_names[notif_actors[0]]} started following you", None,
            ),
            (
                "vybe_accepted", notif_actors[1], notif_actors[1], "user",
                f"{buddy_names[notif_actors[1]]} accepted your Vybe!", None,
            ),
            (
                "ticket_sold", notif_actors[2], event_ids[1], "event",
                f"{buddy_names[notif_actors[2]]} bought a ticket!", "Someone's going to your event.",
            ),
            (
                "event_review", notif_actors[3], event_ids[0], "event",
                f"{buddy_names[notif_actors[3]]} left a 5-star review", EVENT_TITLES[EVENT_TYPES[0]],
            ),
            (
                "event_rsvp", notif_actors[4], event_ids[2], "event",
                f"{buddy_names[notif_actors[4]]} is going to {EVENT_TITLES[EVENT_TYPES[2]]}", None,
            ),
        ]
        # Re-runnable: clear only this script's own notification types for the
        # target before reinserting (actor_id would otherwise dangle to NULL
        # once wipe_existing() above removes the buddies that generated them
        # on a prior run — actor_id is ON DELETE SET NULL, not CASCADE).
        cur.execute(
            "DELETE FROM notifications WHERE user_id = %s::uuid AND type = ANY(%s)",
            (TARGET_USER_ID, [r[0] for r in notif_rows]),
        )
        for i, (ntype, actor_id, entity_id, entity_type, title, body) in enumerate(notif_rows):
            cur.execute(
                """
                INSERT INTO notifications (user_id, type, actor_id, entity_id, entity_type, title, body, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (TARGET_USER_ID, ntype, actor_id, entity_id, entity_type, title, body,
                 now - timedelta(minutes=random.randint(5, 240) + i)),
            )
        print(f"Created {len(notif_rows)} unread in-app notifications for target")

        conn.commit()
    print("Done — seed committed.")


if __name__ == "__main__":
    main()

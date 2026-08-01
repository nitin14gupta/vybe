"""
One-off local-dev seed script — populates the local `vybe` Postgres DB with a
web of demo users, events, RSVPs, reviews, vybe requests/conversations,
follows, and wallet credits so a freshly-registered real account has
something to actually browse (Explore/Trending/People search/DMs).

Only touches data visible to OTHER users — deliberately skips
host_payout_details (encrypted, per-owner-only, never shown to a viewer) and
notifications (per-owner inbox; these seed accounts have fake phone numbers
and can never actually log in to see them).

Safe to re-run: it wipes ONLY the rows it previously created (tracked by the
'seed-demo' interest tag... no — see DEMO_PHONE_PREFIX) before reseeding.

Run with:  server/venv/Scripts/python.exe server/scripts/seed_demo.py
"""
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.config import get_db  # noqa: E402

random.seed(42)

DEMO_PHONE_PREFIX = "90000000"  # +91 90000000XX — obviously-fake range, easy to spot & wipe

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
    "https://images.unsplash.com/photo-1775315815915-43af175d4c95?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775019039895-f04070266f06?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775405325864-2981439bfe6a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775138386053-5766c8c10e85?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775152307243-40212d5068a6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774847895606-eee7989fb36c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775247022803-fd16733e175c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774979517558-a9dfa07cf8d0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775126964224-99c03c0e439c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775126964424-913480443772?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775251801951-ccb61c5bb914?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774790528338-6db76fd93067?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774991061995-9bef4c333de4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://plus.unsplash.com/premium_photo-1683817397956-b46614758fb8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774575902298-564503f168a7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775119223367-03c12e0cbf27?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775151462239-03839a32c4c5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774989251155-0aa32bee5c6c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1773332598451-8a0a59941912?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775133117908-99043faa40b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774847897731-ad86ff58390b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774542414991-eaa61c677c24?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1773332598289-ed0444ad1d6f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774696788918-fabf0c18e126?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774876189300-5ec712826e33?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774660980724-dc0fb4f5dbb6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1775013394343-fdf658742ed0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1773318427480-1058e1059f99?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774333406492-2806c117fe59?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://plus.unsplash.com/premium_photo-1665772800736-e655b2fec2e7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774331510646-a1781c4a9713?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1757549248794-2b2b9db92439?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1528120369764-0423708119ae?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://plus.unsplash.com/premium_photo-1773902044720-94d9f36e65c7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1762743412345-a31d94cd5a88?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1773698403328-e6891737b7dd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1772975657496-1e7107beed75?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1773549809566-09143ebf6cc8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1717360564258-f6a9e4bc308c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774244764160-c6db8d01c4a8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774028156721-706b219614b2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1770929356779-d761b26f29fc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774028156717-6b9f92babd2d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1774105618837-21ea179aef8a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
]


def img(i: int) -> str:
    return UNSPLASH[i % len(UNSPLASH)]


FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Krishna", "Ishaan", "Reyansh", "Arjun", "Kabir",
    "Ananya", "Diya", "Saanvi", "Myra", "Anika", "Kiara", "Aadhya", "Zara",
    "Rohan", "Karan", "Neha", "Priya", "Aisha", "Meera", "Dev", "Yash",
    "Sana", "Riya", "Nikhil", "Tanvi",
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Reddy", "Iyer", "Nair", "Kapoor", "Malhotra",
    "Chopra", "Bhatt", "Rao", "Mehta", "Singh", "Joshi", "Desai", "Pillai",
    "Agarwal", "Bose",
]
BIOS = [
    "Here for the food and the vibes, mostly the food.",
    "Trying to say yes to more things this year.",
    "Music, weekend plans, and overthinking group chats.",
    "New to the city, still figuring out where the good spots are.",
    "Will show up for literally any rooftop event.",
    "Professional over-planner, casual party crasher.",
    "Looking for people who actually show up when they RSVP.",
    "Weekend hikes, weekday chaos.",
    "Currently accepting invites to things I'll definitely attend.",
    "Say hi if you're also just here for the playlist.",
]
GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"]
INTERESTS = [
    "Music", "Travel", "Food", "Sports", "Art", "Movies", "Gaming", "Dance",
    "Fitness", "Comedy", "Photography", "Fashion", "Tech", "Books", "Cooking",
    "Nightlife", "Hiking", "Yoga",
]
CITIES = [
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
    {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946},
    {"name": "Delhi", "lat": 28.7041, "lng": 77.1025},
    {"name": "Pune", "lat": 18.5204, "lng": 73.8567},
    {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"name": "Goa", "lat": 15.2993, "lng": 74.1240},
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2707},
    {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873},
]
EVENT_TYPES = ["house_party", "rooftop", "game_night", "dinner", "music", "other"]
EVENT_TITLES = {
    "house_party": ["Terrace Vibes", "Apartment Warmup", "Late Night House Session"],
    "rooftop": ["Sunset Rooftop Mixer", "Skyline Sundowners", "Rooftop & Chill"],
    "game_night": ["Game Night Squad", "Board Games & Beer", "Card Night Chaos"],
    "dinner": ["Long Table Dinner", "Supper Club", "Family Style Feast"],
    "music": ["Indie Jam Night", "Open Mic + Drinks", "Vinyl Night"],
    "other": ["Sunday Brunch Club", "Poetry & Wine", "Movie Marathon Night"],
}
REVIEW_BODIES = [
    "Such a good time, would come again in a heartbeat.",
    "Great crowd, great music, exactly what I needed this weekend.",
    "Host was super welcoming, made it easy to meet people.",
    "",
    "Loved the vibe, ran a little late starting but worth the wait.",
    "",
    "Best event I've been to in a while honestly.",
    "Good energy all night, met some really cool people.",
    "",
    "Solid turnout, would recommend to anyone new to the city.",
]
MSG_OPENERS = [
    "hey! saw you're also into {interest}, small world",
    "hii, excited for the event this weekend?",
    "yo what's up, you going to any events soon?",
    "hey! love your profile, are you around this weekend?",
]
MSG_REPLIES = [
    "haha yeah! you going to anything soon?",
    "heyy yes super excited, first time trying one of these",
    "not yet but looking, any recs?",
    "thank you! yeah free this weekend actually",
    "for sure, let's figure something out",
    "same here, this app is actually kind of fun",
]

NUM_USERS = 30
NUM_EVENTS = 12


def rand_dob(min_age=19, max_age=30):
    today = datetime.now(timezone.utc).date()
    age = random.randint(min_age, max_age)
    return today.replace(year=today.year - age) - timedelta(days=random.randint(0, 364))


def jitter(v, spread=0.05):
    return round(v + random.uniform(-spread, spread), 6)


def wipe_existing(cur):
    cur.execute("SELECT id FROM users WHERE phone LIKE %s", (DEMO_PHONE_PREFIX + "%",))
    ids = [r["id"] for r in cur.fetchall()]
    if not ids:
        return
    cur.execute("DELETE FROM users WHERE id = ANY(%s)", (ids,))
    print(f"Wiped {len(ids)} previous demo users (cascades cover their events/photos/etc.)")


def main():
    with get_db() as (cur, conn):
        wipe_existing(cur)

        # ── Users ──────────────────────────────────────────────────────────
        user_ids = []
        user_names = {}
        for i in range(NUM_USERS):
            uid = str(uuid.uuid4())
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            username = f"{first.lower()}{last.lower()}{i}"
            city = CITIES[i % len(CITIES)]
            phone = f"{DEMO_PHONE_PREFIX}{i:02d}"
            my_interests = random.sample(INTERESTS, k=random.randint(3, 4))

            cur.execute(
                """
                INSERT INTO users (
                    id, phone, country_code, name, dob, gender, city, lat, lng,
                    interests, profile_complete, bio, username, is_host_onboarding_finished
                ) VALUES (%s, %s, '+91', %s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s, %s)
                """,
                (
                    uid, phone, name, rand_dob(), random.choice(GENDERS), city["name"],
                    jitter(city["lat"]), jitter(city["lng"]), my_interests,
                    random.choice(BIOS), username, i < 12,  # first 12 users are hosts
                ),
            )
            for pos in range(2):
                cur.execute(
                    "INSERT INTO user_photos (user_id, url, r2_path, position) VALUES (%s, %s, %s, %s)",
                    (uid, img(i * 2 + pos), f"seed/{uid}-{pos}.jpg", pos),
                )
            user_ids.append(uid)
            user_names[uid] = name
        print(f"Created {len(user_ids)} demo users ({sum(1 for i in range(NUM_USERS) if i < 12)} hosts)")

        host_ids = user_ids[:12]

        # ── Events ─────────────────────────────────────────────────────────
        now = datetime.now(timezone.utc)
        event_ids = []
        event_titles = {}
        event_is_past = {}
        img_cursor = 60  # continue past the user-photo range

        for e in range(NUM_EVENTS):
            host_id = host_ids[e % len(host_ids)]
            etype = EVENT_TYPES[e % len(EVENT_TYPES)]
            title = random.choice(EVENT_TITLES[etype])
            is_past = e < NUM_EVENTS // 2
            date_time = (now - timedelta(days=random.randint(3, 30)) if is_past
                         else now + timedelta(days=random.randint(2, 21)))
            end_time = date_time + timedelta(hours=random.choice([2, 3, 4]))
            is_free = e % 3 == 0
            price = 0 if is_free else random.choice([99, 149, 199, 299, 499])
            fee, commission, profit = (0, 0, 0) if is_free else (50, round(price * 0.10), 50 + round(price * 0.10))
            capacity = random.randint(16, 22)
            eid = str(uuid.uuid4())
            city = CITIES[e % len(CITIES)]
            covers = [img(img_cursor), img(img_cursor + 1)]
            img_cursor += 2

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
                    eid, host_id, title,
                    f"{title} — good music, good people, come through and vibe with us.",
                    "Be respectful, be on time, and bring good energy.",
                    etype, date_time, end_time, capacity, capacity,
                    f"{city['name']}, India", jitter(city["lat"]), jitter(city["lng"]),
                    price, json.dumps(covers), fee, commission, profit,
                    date_time - timedelta(days=random.randint(5, 15)),
                ),
            )
            event_ids.append(eid)
            event_titles[eid] = title
            event_is_past[eid] = is_past

            # ── Attendees: 10-12 unique guests, excluding the host ──────────
            pool = [u for u in user_ids if u != host_id]
            attendees = random.sample(pool, k=min(random.randint(10, 12), len(pool)))
            checked_in_pool = []
            for a in attendees:
                checked_in_at = None
                if is_past and random.random() < 0.85:
                    checked_in_at = date_time + timedelta(minutes=random.randint(5, 90))
                    checked_in_pool.append(a)
                cur.execute(
                    """
                    INSERT INTO event_attendees (event_id, user_id, status, joined_at, checked_in_at)
                    VALUES (%s, %s, 'going', %s, %s)
                    """,
                    (eid, a, date_time - timedelta(days=random.randint(1, 10)), checked_in_at),
                )
            cur.execute(
                "UPDATE events SET spots_left = spots_left - %s WHERE id = %s",
                (len(attendees), eid),
            )

            # ── Reviews: 10-12 of the checked-in guests leave one ───────────
            if is_past and checked_in_pool:
                reviewers = checked_in_pool[:12] if len(checked_in_pool) >= 10 else checked_in_pool
                for r in reviewers:
                    rating = random.choices([3, 4, 5], weights=[1, 3, 5])[0]
                    body = random.choice(REVIEW_BODIES) or None
                    cur.execute(
                        "INSERT INTO event_reviews (event_id, reviewer_id, rating, body) VALUES (%s, %s, %s, %s)",
                        (eid, r, rating, body),
                    )

        print(f"Created {len(event_ids)} events with 10-12 attendees + reviews each")

        # ── Follows ────────────────────────────────────────────────────────
        follow_pairs = set()
        for u in user_ids:
            others = [o for o in user_ids if o != u]
            for target in random.sample(others, k=random.randint(2, 5)):
                pair = (u, target)
                if pair in follow_pairs:
                    continue
                follow_pairs.add(pair)
                cur.execute(
                    "INSERT INTO follows (follower_id, following_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (u, target),
                )
        print(f"Created {len(follow_pairs)} follow relationships")

        # ── Vybe requests + conversations/messages ────────────────────────
        used_pairs = set()

        def rand_pair():
            for _ in range(20):
                a, b = random.sample(user_ids, 2)
                key = tuple(sorted((a, b)))
                if key not in used_pairs:
                    used_pairs.add(key)
                    return a, b
            return None, None

        accepted = 0
        for _ in range(12):
            sender, receiver = rand_pair()
            if not sender:
                continue
            interest = random.choice(INTERESTS)
            msg = MSG_OPENERS[accepted % len(MSG_OPENERS)].format(interest=interest)
            cur.execute(
                """
                INSERT INTO vibe_requests (sender_id, receiver_id, message, status)
                VALUES (%s, %s, %s, 'accepted')
                RETURNING id
                """,
                (sender, receiver, msg),
            )
            vybe_id = cur.fetchone()["id"]
            u1, u2 = sorted((sender, receiver))
            last_at = now - timedelta(hours=random.randint(1, 72))
            cur.execute(
                """
                INSERT INTO conversations (user1_id, user2_id, vybe_request_id, status, last_message_at)
                VALUES (%s, %s, %s, 'active', %s) RETURNING id
                """,
                (u1, u2, vybe_id, last_at),
            )
            conv_id = cur.fetchone()["id"]
            thread = [msg] + random.sample(MSG_REPLIES, k=random.randint(2, 4))
            senders = [sender, receiver]
            t = last_at - timedelta(minutes=len(thread) * 4)
            for i, body in enumerate(thread):
                t += timedelta(minutes=random.randint(2, 6))
                cur.execute(
                    "INSERT INTO messages (conversation_id, sender_id, content, sent_at) VALUES (%s, %s, %s, %s)",
                    (conv_id, senders[i % 2], body, t),
                )
            accepted += 1

        pending = 0
        for _ in range(10):
            sender, receiver = rand_pair()
            if not sender:
                continue
            cur.execute(
                "INSERT INTO vibe_requests (sender_id, receiver_id, message, status) VALUES (%s, %s, %s, 'pending')",
                (sender, receiver, f"hey {user_names[receiver].split()[0]}, down to vybe?"),
            )
            pending += 1

        passed = 0
        for _ in range(5):
            sender, receiver = rand_pair()
            if not sender:
                continue
            cur.execute(
                """
                INSERT INTO vibe_requests (sender_id, receiver_id, status, passed_at, cooldown_until)
                VALUES (%s, %s, 'passed', %s, %s)
                """,
                (sender, receiver, now - timedelta(days=1), now + timedelta(days=6)),
            )
            passed += 1

        print(f"Created {accepted} accepted vybes (+chats), {pending} pending, {passed} passed/cooldown")

        # ── Wallet credits (simulated refunds) ────────────────────────────
        wallet_users = random.sample(user_ids, k=4)
        for u in wallet_users:
            amount = random.choice([99, 199, 299])
            cur.execute(
                "UPDATE users SET wallet_balance = wallet_balance + %s WHERE id = %s",
                (amount, u),
            )
            cur.execute(
                """
                INSERT INTO wallet_transactions (user_id, amount_inr, type, source, description, expires_at)
                VALUES (%s, %s, 'credit', 'event_refund', 'Refund for a cancelled event', %s)
                """,
                (u, amount, now + timedelta(days=180)),
            )
        print(f"Credited {len(wallet_users)} wallets with a refund-style credit")

        conn.commit()
    print("Done — seed committed.")


if __name__ == "__main__":
    main()

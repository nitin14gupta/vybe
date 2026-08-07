"""One-off QA script — sends one push per notification type we've built
straight to a given Expo push token, so you can eyeball every title/body/
image on-device without needing to actually trigger each real backend event
(RSVP, payment, waitlist promotion, etc.) by hand.

Bypasses routes/notifications.py + utils.push.send_push's DB/category-gate
logic entirely (no notification_prefs check, no device_tokens lookup) —
this hits Expo's push API directly with the token you pass in, so a
disabled category on your account can't silently swallow one of these.

Usage:
    python scripts/send_test_notifications.py <expo_push_token>
"""
import sys
import time
import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# Pulled live from the DB (see conversation) — a real cover photo + avatar
# so the rich-image preview actually renders instead of a blank/broken image.
EVENT_COVER = "https://pub-f5cb81cf85a5471d9abf932f74d1ae0e.r2.dev/events/76ee7d9f-b78d-477b-8711-61593ef8409e/covers/9db717ee-8717-4e27-a269-6874a882b3e8.jpeg"
USER_AVATAR = "https://pub-f5cb81cf85a5471d9abf932f74d1ae0e.r2.dev/users/9b837f75-37a4-443f-b59b-533fdadc7995/photos/d97c7a31-e3c2-4f9d-83a9-2057c15edecf.webp"
EVENT_ID = "76ee7d9f-b78d-477b-8711-61593ef8409e"
USER_ID = "9b837f75-37a4-443f-b59b-533fdadc7995"

# (label, title, body, data, image_url) — label is just for the console log
NOTIFICATIONS = [
    ("event_created (follower)", "Saanvi just posted an event", "Indie Jam Night", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_created_confirmation (host)", "Your event is live!", "Indie Jam Night was posted successfully.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("host_badge_earned", "You're a Rising Host now! \U0001f31f", "Keep it up — more hosted events means more visibility for your next one.", {"type": "profile", "user_id": USER_ID}, USER_AVATAR),
    ("event_updated", "Event details changed", "The host updated Indie Jam Night. Check what's new.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_rsvp (host)", "New RSVP", "Priya is going to Indie Jam Night", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("rsvp_confirmed (attendee, free)", "You're going! \U0001f389", "Your ticket for Indie Jam Night is ready — tap to view it.", {"type": "ticket_ready", "event_id": EVENT_ID}, EVENT_COVER),
    ("payment_confirmed (attendee, paid)", "Payment confirmed!", "Your ticket is ready. \U0001f389", {"type": "payment_success", "event_id": EVENT_ID}, EVENT_COVER),
    ("ticket_sold (host)", "Priya bought a ticket!", "Someone's going to Indie Jam Night.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_sold_out (host)", "Your event sold out!", "Indie Jam Night has no spots left.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("waitlist_promoted", "A spot opened up!", "You have 1 hour to confirm your spot at Indie Jam Night.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("waitlist_expired", "Spot offer expired", "Your reserved spot at Indie Jam Night was given to the next person.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_cancelled_host", "Event cancelled", "You cancelled Indie Jam Night. Attendees have been notified and refunded.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_cancelled (attendee)", "Event cancelled", "Indie Jam Night was cancelled by the host.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("waitlist_event_cancelled", "Event cancelled", "Indie Jam Night was cancelled. You've been removed from the waitlist.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_review (host)", "Priya left a 5-star review", "Indie Jam Night", {"type": "event", "event_id": EVENT_ID}, USER_AVATAR),
    ("review_milestone", "10 reviews and 4.8★ average!", "Your reputation is building — attendees are loving what you host. Keep it up for more visibility.", {"type": "profile", "user_id": USER_ID}, USER_AVATAR),
    ("report_submitted", "Report submitted", "Thanks for letting us know — our team will review it shortly.", {"type": "event", "event_id": EVENT_ID}, None),
    ("new_follower", "Priya started following you", None, {"type": "profile", "user_id": USER_ID}, USER_AVATAR),
    ("vybe_request", "Priya sent you a Vybe!", None, {"type": "profile", "user_id": USER_ID}, USER_AVATAR),
    ("vybe_accepted", "Priya accepted your Vybe!", None, {"type": "conversation", "conv_id": "test"}, USER_AVATAR),
    ("host_onboarding_complete", "You're all set to host!", "Your payout details are saved — go ahead and create your first event.", {"type": "host_onboarding_complete"}, USER_AVATAR),
    ("event_starting_soon 24h", "Tomorrow's the day! \U0001f389", "Indie Jam Night is happening in 24 hours.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_starting_soon 7h", "Get ready \U0001f440", "Indie Jam Night starts in 7 hours — start planning your outfit.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("event_starting_soon 1h", "It's almost time! \U0001f3c3", "Indie Jam Night starts in 1 hour — get dressed, you're on your way.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("checked_in", "You're checked in! \U0001f389", "Enjoy Indie Jam Night.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("payout_coming_soon (host)", "Your payout is on its way", "Indie Jam Night just wrapped — your payout will be sent soon.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("follow_rsvp (social proof)", "Priya is going to Indie Jam Night", "Someone you follow just RSVPed — check it out.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("host_low_capacity: almost_sold_out", "Your event is almost sold out!", "Indie Jam Night is almost full — raise capacity to let more people in.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("host_low_capacity: waitlist_forming", "People are waitlisting for your event", "Indie Jam Night has a growing waitlist — consider raising capacity.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("reengagement", "It's been a while \U0001f440", "Here's what's happening near you this weekend — come see.", {"type": "home"}, None),
    ("wallet_expiring", "Wallet credit expiring soon", "₹200 in your Gorave Wallet expires in 1 week — use it before it's gone.", {"type": "wallet"}, None),
    ("first_event_hosted", "You're officially a host! \U0001f973", "Indie Jam Night is your first event — nice work.", {"type": "event", "event_id": EVENT_ID}, EVENT_COVER),
    ("birthday_soon 15d", "Your birthday's coming up... \U0001f440\U0001f382", "15 days left. Just saying — a birthday house party would be pretty iconic.", {"type": "createEvent"}, None),
    ("birthday_soon 10d", "Okay but hear us out \U0001f60f", "10 days to your birthday. Everyone loves an excuse to get dressed up for you.", {"type": "createEvent"}, None),
    ("birthday_soon 7d", "One week, birthday star ✨", "7 days left. Stop thinking about it and throw the party already.", {"type": "createEvent"}, None),
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/send_test_notifications.py <expo_push_token>")
        sys.exit(1)
    token = sys.argv[1]

    print(f"Sending {len(NOTIFICATIONS)} test notifications to {token}\n")
    for label, title, body, data, image_url in NOTIFICATIONS:
        msg = {
            "to": token,
            "title": title,
            "body": body or "",
            "data": data,
            "sound": "default",
            "priority": "high",
        }
        if image_url:
            msg["richContent"] = {"image": image_url}
            msg["mutableContent"] = True

        try:
            resp = httpx.post(EXPO_PUSH_URL, json=[msg], timeout=10)
            result = resp.json()
            status = result.get("data", [{}])[0].get("status", "?")
            print(f"[{status}] {label}")
            if status != "ok":
                print(f"    -> {result}")
        except Exception as e:
            print(f"[ERROR] {label}: {e!r}")

        time.sleep(0.4)  # stay comfortably under Expo's rate limit

    print("\nDone. Check your device — they'll stack in the notification tray.")


if __name__ == "__main__":
    main()

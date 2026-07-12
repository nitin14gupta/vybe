# Notifications Overview

This table breaks down all the major actions in the app that trigger notifications, showing whether they send a **Push Notification** (to the device's lock screen), an **In-App Notification** (to the notifications tab in the app), or **Both**.

| Event / Action | Push Notification | In-App Notification | Sent To |
| :--- | :---: | :---: | :--- |
| **Chat & Connections** | | | |
| Someone sends you a Vybe | ✅ | ✅ | Receiver |
| Someone accepts your Vybe | ✅ | ✅ | Sender |
| Someone follows you | ✅ | ✅ | Followee |
| You receive a new chat message | ✅ | ❌ | Message Receiver |
| Someone reacts to your message | ✅ | ❌ | Message Sender |
| **Events** | | | |
| Your event was created successfully | ✅ | ✅ | Host (creator) |
| Someone you follow posts an event | ✅ | ✅ | Followers |
| Someone RSVPs to your event | ✅ | ✅ | Event Host |
| Host edits event details (time/location/price/etc.) | ✅ | ✅ | Confirmed + Waitlisted Attendees |
| Event is cancelled | ✅ | ✅ | Confirmed Attendees |
| Event is cancelled | ✅ | ✅ | Waitlisted Users |
| Waitlist spot opens up for you | ✅ | ✅ | Promoted User |
| Your waitlist spot offer expires | ✅ | ✅ | User who missed out |
| Someone leaves a review on your event | ✅ | ✅ | Event Host |
| Your event sold out (0 spots left) | ✅ | ✅ | Event Host |
| **Payments & Ticketing** | | | |
| Ticket payment confirmed | ✅ | ✅ | Ticket Buyer |
| Someone bought a ticket to your event | ✅ | ✅ | Event Host |
| **Trust & Safety** | | | |
| You submitted a report (user/event/message) | ❌ | ✅ | Reporter |

> [!NOTE]
> There is no "Cancel RSVP" button in the client for confirmed ("going") attendees, so the old "Someone cancels their RSVP" notification (host-facing) has been removed as dead logic. Leaving a waitlist spot is a separate, still-supported flow and is unaffected.
>
> New chat messages and message reactions still send **Push Notifications only** — no change requested for these.
>
> Report-submitted confirmations are **in-app only** and go only to the reporter — the reported user/event/message owner is never notified, to avoid tipping off bad actors.
>
> "Event edited" only fires when a substantive field changes (title, description, rules, type, date/time, age restriction, location, or price) — pure capacity increases/decreases don't trigger it (those already notify waitlisted users separately when they get promoted).
>
> "Sold out" fires once at the moment spots_left transitions from 1 → 0, for both free RSVPs and all three paid-ticket payment paths (Razorpay checkout, QR code, wallet). If the event later opens back up (e.g. a cancellation) and fills again, it will fire again.

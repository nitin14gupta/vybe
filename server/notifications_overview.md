# Notifications Overview

This table breaks down all the major actions in the app that trigger notifications, showing whether they send a **Push Notification** (to the device's lock screen), an **In-App Notification** (to the notifications tab in the app), or **Both**.

| Event / Action | Push Notification | In-App Notification | Sent To |
| :--- | :---: | :---: | :--- |
| **Chat & Connections** | | | |
| Someone sends you a Vybe | ✅ | ❌ | Receiver |
| Someone accepts your Vybe | ✅ | ✅ | Sender |
| Someone follows you | ✅ | ❌ | Followee |
| You receive a new chat message | ✅ | ❌ | Message Receiver |
| Someone reacts to your message | ✅ | ❌ | Message Sender |
| **Events** | | | |
| Someone you follow posts an event | ✅ | ✅ | Followers |
| Someone RSVPs to your event | ✅ | ✅ | Event Host |
| Someone cancels their RSVP | ✅ | ❌ | Event Host |
| Event is cancelled | ✅ | ❌ | Confirmed Attendees |
| Event is cancelled | ✅ | ✅ | Waitlisted Users |
| Waitlist spot opens up for you | ✅ | ✅ | Promoted User |
| Your waitlist spot offer expires | ✅ | ✅ | User who missed out |
| Someone leaves a review on your event | ✅ | ❌ | Event Host |
| **Payments & Ticketing** | | | |
| Ticket payment confirmed | ✅ | ❌ | Ticket Buyer |

> [!NOTE]
> Currently, things like new chat messages and new followers only send **Push Notifications**. If you want those to also appear in the in-app notification center, we would need to add `notify_` helper functions for them!

# Phase 5 — Profile Tab

## Goal
Flesh out the profile tab: edit profile (photos, bio, voice, interests, location), my tickets screen, host dashboard.

---

## Screens

### Profile Tab (own profile) — enhancements
Current state: avatar row, bio, stats (Vibers/Vibing/Posts), badges, interests, voice card, photo grid.

**New additions**:
- Stats row update: Connections · Events Attended · Events Hosted (replace Vibers/Vibing/Posts)
- "My Upcoming Events" section: horizontal event card scroll (if any booked)
- "My Tickets" row link → My Tickets screen
- If has hosted events: "My Events (Host)" section with hosted event cards
- "Host an Event" CTA button (leads to Create Event flow)

### Edit Profile (full screen)
**Header**: Back arrow left (confirmation dialog if unsaved changes). "Edit Profile" centre 18pt semibold. "Save" right orange text button.

**Sections** (scrollable):
- **Photos**: horizontal scroll of current photos. Tap to reorder (drag). Tap ✕ to delete. "+" add button.
- **About**: Name text input. Bio textarea (max 200 chars, char counter).
- **Voice Intro**: current waveform player + "Re-record" button (launches recording flow).
- **Interests**: same tag selector grid as onboarding — tap to toggle (min 3, max 10).
- **Location**: current city display + "Change" orange link (re-runs location flow).

**Save behaviour**: `PATCH /users/me` with changed fields only. On success: pop back + refresh profile.

### My Tickets (full screen)
**Header**: Back left. "My Tickets" centre. Two sub-tabs: Upcoming / Past.

**Ticket rows**:
- Event photo left (small 16:9) + title + date + host name right
- QR icon button right edge → full-screen QR
- Status badge: "Confirmed" green / "Attended" muted / "Cancelled" red outline
- Tap row → expand to show QR inline, or open QR full screen
- QR full screen: max brightness, booking ID below QR

### Host Dashboard (full screen)
**Header**: Back left. "My Events" left 22pt bold. Right: "+ New Event" orange pill (launches Create Event flow).

**Stats row** (top):
- Total events hosted
- Total guests across all events
- Total earned (₹)

**Event cards** (Upcoming / Past tabs):
- Photo left + title + date right
- Capacity bar (orange filled, "X/Y going")
- Revenue earned in green
- Three-dot menu: Edit / View Attendees / Cancel

---

## API Endpoints

| Method | Path | Notes |
|---|---|---|
| PATCH | `/users/me` | partial update: name, bio, interests, city, lat/lng |
| POST | `/users/me/photos` | add photo (multipart) |
| DELETE | `/users/me/photos/{id}` | remove photo |
| PATCH | `/users/me/photos/reorder` | `{ order: [id1, id2, ...] }` |
| GET | `/tickets` | my tickets with event details |
| GET | `/tickets/{id}/qr` | QR code data (booking ID) |
| GET | `/events/hosted` | events I've hosted |
| GET | `/events/hosted/stats` | total guests, total earned |

---

## DB Changes

Add to `users`:
```sql
events_attended_count INT DEFAULT 0
events_hosted_count INT DEFAULT 0
```
(Incremented via triggers on `bookings` and `events` tables.)

---

## Test Cases

1. Stats row shows correct Connections / Events Attended / Events Hosted counts
2. "My Upcoming Events" section appears when user has upcoming bookings
3. "Host an Event" CTA navigates to Create Event flow
4. Edit Profile: save changes → profile screen reflects new data
5. Edit Profile: back with unsaved changes → confirmation dialog
6. Edit Profile photos: reorder persists
7. Edit Profile photos: delete removes from grid
8. Edit Profile voice: "Re-record" launches recording, new audio saved
9. Edit Profile interests: min 3 enforced
10. My Tickets: tickets shown under correct Upcoming/Past tab
11. Tap QR icon → QR expands full screen
12. Host Dashboard: stats row accurate
13. Host Dashboard capacity bar fills proportionally
14. Three-dot "Cancel" event → confirmation dialog

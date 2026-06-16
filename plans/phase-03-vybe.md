# Phase 3 — Vybe Tab (Centre)

## Goal
The centre tab is the social heartbeat — vibe requests inbox with Received/Sent tabs, full vibe view, ice breaker on accept, 24h cooldown screen.

---

## Screens

### Vybe Tab — Requests Inbox
**Header**: "Vibes" left 22pt bold. No right action. Below: two segmented tabs — "Received" (with unread count badge) / "Sent". Active tab has orange underline.

**Received tab**:
- Cards, one per incoming vibe request
- Left: blurred profile photo (revealed on accept)
- Right: name, match %, message preview (italic, truncated 2 lines)
- Timestamp top-right
- Accept (green ✓) + Pass (✕) buttons on card
- Swipe right = Accept, swipe left = Pass

**Sent tab**:
- Same card layout with status badges:
  - "Pending" — muted orange pill
  - "Accepted" — green pill, tap opens chat
  - "No response" — muted grey (after 3 days)
  - "Expired" — grey (auto-expires after 7 days)

**Empty states**:
- No received: flame icon dimmed + "No vibes yet. Keep exploring!" + "Discover People" button
- No sent: "You haven't sent any vibes yet" + "Start discovering" button

### Incoming Vibe — Full View (full screen)
**Header**: Back arrow left. "Vibe Request" centre 18pt semibold.

**Content**:
- Top half: blurred profile photo full width (10px blur — only name visible)
- Their message in coral-outline chat bubble
- Match score + shared interests row
- "Accept Vibe 🔥" gradient button full width
- "Pass" outline button
- Note: "Accepting reveals their photos and starts a chat"
- Accept → triggers Ice Breaker Modal

### Ice Breaker Modal (bottom sheet)
**Header**: Drag handle. "You matched! 🎉" centre 18pt semibold with confetti CSS animation.

**Content**:
- "Send [Name] a first message?" label
- Text input pre-filled with suggested opener (editable)
- "Send & Open Chat" gradient full-width button
- "Just Accept (no message)" muted text link
- Both → navigate to Chat thread

### Cooldown Screen (full screen)
**Header**: Back arrow. No title text.

**Content**:
- Dimmed flame SVG (extinguished)
- "Not yet..." 24pt heading
- "You can vibe [Name] again in:" label
- Live countdown timer (large, orange, Cabinet Grotesk Bold)
- "After a pass, there's a 24-hour cooldown" muted explanation
- "Go Back" outline button

---

## API Endpoints

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/vibes/received` | — | returns pending received requests |
| GET | `/vibes/sent` | — | returns all sent requests with status |
| POST | `/vibes` | `{ target_id, message? }` | send vibe request |
| PATCH | `/vibes/{id}` | `{ action: 'accept' \| 'pass' }` | respond to received vibe |
| GET | `/vibes/{target_id}/cooldown` | — | returns `{ on_cooldown: bool, reset_at: ISO }` |

---

## DB: `vibe_requests` table

```sql
id UUID PK
sender_id UUID → users.id
receiver_id UUID → users.id
message TEXT  -- optional message with request
status TEXT DEFAULT 'pending'  -- pending | accepted | passed | expired
created_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
passed_at TIMESTAMPTZ  -- for cooldown calculation
UNIQUE(sender_id, receiver_id)  -- one active request at a time
```

**Cooldown logic**: if `passed_at` is not null and `NOW() - passed_at < 24 hours`, user is on cooldown.

**Auto-expire**: cron or trigger: `UPDATE vibe_requests SET status='expired' WHERE status='pending' AND expires_at < NOW()`.

---

## Test Cases

1. Received tab shows incoming vibe requests
2. Blurred photo visible — not un-blurred before accept
3. Swipe right on received card → accepts, photo revealed
4. Swipe left on received card → passes, card dismissed
5. Accept → Ice Breaker Modal appears
6. "Send & Open Chat" → navigates to chat thread with that person
7. "Just Accept" → navigates to chat thread (no first message)
8. Sent tab shows correct status badges
9. "Accepted" pill tappable → opens chat thread
10. Pass after 24h → cooldown screen NOT shown
11. Pass then immediately try to vibe same person → cooldown screen shown with live timer
12. After 7 days with no response → status shows "Expired"
13. Unread badge count on tab icon updates correctly

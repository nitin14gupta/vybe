# Phase 1 — Discover Tab

## Goal
Polish the discover card stack with voice intro playback, working filter sheet, correct swipe/button action semantics, and valid VIBE MATCH %.

---

## Swipe Action Map

| Gesture / Button | Meaning | API |
|---|---|---|
| Swipe left / ✕ button | Pass (reject) | `POST /discover/pass { target_id }` |
| 🔥 fire button (middle) | Vibe Request + Follow | `POST /vibes` + `POST /follows` |
| Swipe right | Follow only | `POST /follows { target_id }` |

---

## Screen: Discover (main)

**Header**: "Discover" left (Cabinet Grotesk Bold 22pt). Right: filter icon button → opens Filter Sheet.

**Card stack**:
- Top card fully visible, next card peeking at depth behind
- Full-bleed photo, gradient overlay bottom 40%
- Name + age + city, bottom-left of card
- Interest chips top-right (max 3)
- VIBE MATCH % badge top-left (gradient pill)
- **Voice intro button** top-right (glass circle 36px) — tap to play/pause
  - While playing: `PlaybackWave compact` animates inside/beside button
  - Stops automatically on: swipe, tab change, card advance

**Action buttons below card**:
- ✕ (Pass) — left
- 🔥 (Vibe + Follow) — centre, raised orange 72px circle
- ★ (Star/save) — right (for future use, currently acts as follow)

---

## Filter Sheet

**Trigger**: filter icon in discover header.

**Controls**:
- Show me: segmented — Women / Men / Everyone
- Age range: 18–45+ (two thumbs)
- Max distance: 1–100 km slider
- Apply Filters button (gradient, pinned bottom)
- Reset text button (top right)

**API**: filter params passed as query string to `GET /discover`

---

## VIBE MATCH % Formula (server-side, already live)

```
match_pct = min(99, 35 + round((overlap / max(|my_interests|, |their_interests|)) * 64))
```
- 0% if either user has no interests
- 35–99% otherwise
- No client change needed — value comes from API

---

## API Endpoints

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/discover` | — | query: `limit, gender, min_age, max_age, max_distance_km` |
| POST | `/follows` | `{ target_id }` | follow a user |
| POST | `/vibes` | `{ target_id, message? }` | send vibe request |
| POST | `/discover/pass` | `{ target_id }` | record pass (soft reject) |

---

## DB Changes

- `follows` table: already in migration `20250616_follows.py` — run it
- `vibe_requests` table: `id, sender_id, receiver_id, message, status (pending/accepted/passed/expired), created_at, expires_at`

---

## Test Cases

1. Voice button visible on card when `voice_url` present; hidden when null
2. Tap voice → audio plays + waveform animates
3. Swipe left while audio playing → audio stops before animation
4. Switch tab while audio playing → audio stops
5. Card advance → audio resets (fresh mount)
6. Tap ✕ → card flies left, pass API called
7. Swipe right → card flies right, follow API called
8. Tap 🔥 → card flies right, vibe + follow APIs both called
9. Filter sheet opens from filter icon
10. Apply filters with age 20–30 → feed reloads, network request has `min_age=20&max_age=30`
11. Reset → all controls back to default
12. VIBE MATCH % shown as non-zero for users with shared interests
13. Empty state shows when no users left in feed
14. Error state shows on network failure with retry button

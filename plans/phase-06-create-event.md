# Phase 6 — Create Event Flow

## Goal
4-step event creation flow accessible from: Events tab "+" button, Host Dashboard FAB, Profile "Host an Event" CTA.

---

## Flow Overview

Step 1 → Step 2 → Step 3 → Step 4 → Preview → Publish → Success

Progress bar below header (4 segments, active fills orange). Step indicator right of header "1 of 4".

---

## Step 1 — Details

**Header**: Back left (confirm discard). "Create Event" centre. "1 of 4" right.

**Fields**:
- Event type chips (single select): Music / Food & Drink / Sports / Art / Wellness / Social / Other
- Title text input (required, max 60 chars)
- Description textarea (max 500 chars, char counter)
- Rules textarea (optional, max 300 chars, "House rules, dress code, etc.")

**Next button** pinned bottom (disabled until title + type filled).

---

## Step 2 — Date & Capacity

**Fields**:
- Date: date picker (native DateTimePicker or custom modal)
- Start time + End time (time pickers)
- Capacity: stepper (− / count / +), min 2, max 500
- Age restriction: toggle + number input (e.g. "18+")

**Validation**: date must be in the future, end > start.

---

## Step 3 — Location

**Full-screen map** with draggable pin. User drags pin to event location.

- Search bar at top (places autocomplete) — react-native-google-places-autocomplete or manual geocoding
- "Use my current location" button
- Location name text field below map (editable, auto-filled from reverse geocode)
- Lat/lng stored on confirm

---

## Step 4 — Price & Photos

**Fields**:
- Price toggle: Free / Paid
  - If paid: price input (₹), platform fee note ("Vybe takes 5%")
- Photos upload (up to 5): grid of + buttons, tap to pick from gallery
  - First photo = cover photo
  - Drag to reorder

**Preview button** → Preview screen.

---

## Preview Screen

Full Event Detail view (read-only) with "Edit" back button + "Publish" gradient button.

**Publish**:
- `POST /events` with full payload
- Success: celebration animation → "Your event is live!" → navigates to Event Detail

---

## API

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/events` | full event object | creates + publishes |
| PUT | `/events/{id}` | partial update | edit after publish |
| POST | `/events/{id}/photos` | multipart | add photos |
| DELETE | `/events/{id}/photos/{pos}` | — | remove photo |

---

## DB: `events` table (full schema)

```sql
id UUID PK DEFAULT gen_random_uuid()
host_id UUID NOT NULL → users.id
title TEXT NOT NULL
description TEXT
rules TEXT
event_type TEXT NOT NULL
date_time TIMESTAMPTZ NOT NULL
end_time TIMESTAMPTZ
duration_minutes INT GENERATED AS (EXTRACT(EPOCH FROM end_time - date_time)/60)
capacity INT NOT NULL DEFAULT 20
spots_left INT NOT NULL DEFAULT capacity
age_restriction INT  -- min age (NULL = no restriction)
location_name TEXT
location_lat FLOAT
location_lng FLOAT
price_inr INT NOT NULL DEFAULT 0
is_free BOOL GENERATED ALWAYS AS (price_inr = 0) STORED
amenities TEXT[] DEFAULT '{}'
is_published BOOL DEFAULT FALSE
is_cancelled BOOL DEFAULT FALSE
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

---

## Test Cases

1. Access from Events tab "+" → Create Event step 1
2. Access from Profile "Host an Event" → same flow
3. Step 1: "Next" disabled until title + type filled
4. Step 2: date in past → "Next" disabled + error shown
5. Step 3: drag pin → location name auto-fills
6. Step 3: search for a place → pin moves to that location
7. Step 4: toggle Free/Paid → price input shows/hides
8. Step 4: upload 5 photos → 6th + button disappears
9. Preview screen shows all entered data correctly
10. Publish → POST /events called → success animation → event visible in Events tab
11. Back mid-flow → confirmation dialog "Discard event?"
12. Edit published event → PUT /events/{id} called

# Phase 2 — Events Tab

## Goal
Build the Events tab: full-screen map view (default) and list view toggle, event detail screen, filter sheet.

---

## Screens

### Events — Map View (default)
**Header**: floats over map (transparent, no card). Left: "Events" Cabinet Grotesk Bold 22pt white. Right: list-view toggle icon + filter icon on glass pill.

**Map**:
- Full-screen map (react-native-maps, dark style)
- Custom orange circle pins per event
- Pin tap → mini event card pops above pin
- Bottom: horizontal scroll of event preview cards (photo + title + date + price + distance)

**Interactions**:
- Tap pin → highlight, show preview card
- Tap preview card → Event Detail
- Tap list icon → switch to List view
- Tap filter → Filter Sheet

### Events — List View
**Header**: "Events" left 22pt bold. Right: map-view toggle + filter icon. Below header: horizontal filter chips (All / Free / Tonight / This Weekend / Music / Food / Sports).

**Cards** (vertical scroll):
- Photo left 40%, content right 60%
- Title, host row (avatar + name + verified badge), date+time, location, price badge
- Heart save button top-right
- "X spots left" coral when capacity < 10

### Event Detail (full screen)
**Header**: No standard bar. Back arrow overlaid top-left (glass circle). Share icon top-right (glass circle). Title appears in sticky top bar only after scrolling past hero.

**Content** (scrollable):
- Hero image carousel full width
- Event title, date+time, location row
- Host card (avatar, name, verified, event count)
- About section (full description)
- Rules section (collapsible)
- Age restriction badge, amenities chips
- Attendee avatars row + count
- Static map embed

**Sticky bottom bar**:
- "X spots left" coral left
- Price bold centre
- "Book Now" gradient button right
- If full: "Join Waitlist" outline
- If booked: "View My Ticket" green
- If host: "Manage Event"

### Filter Sheet (events)
- Category: chips (All / Music / Food / Sports / Art / Wellness)
- Date range: Today / This Week / This Month / Custom
- Price: Free only toggle + max price slider
- Distance: slider 1–50km
- Apply / Reset

---

## API Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/events` | query: `lat, lng, radius_km, category, date_from, date_to, is_free, limit, offset` |
| GET | `/events/{id}` | full event detail |
| POST | `/events/{id}/save` | save/unsave toggle |
| GET | `/events/{id}/attendees` | attendee list (preview 5 + count) |

---

## DB: `events` table

```sql
id UUID PK
host_id UUID → users.id
title TEXT NOT NULL
description TEXT
rules TEXT
event_type TEXT  -- music, food, sports, art, wellness, social
date_time TIMESTAMPTZ NOT NULL
duration_minutes INT
capacity INT
spots_left INT  -- decremented on booking
age_restriction INT  -- minimum age
location_name TEXT
location_lat FLOAT
location_lng FLOAT
price_inr INT  -- 0 = free
is_free BOOL GENERATED AS (price_inr = 0)
cover_photos JSONB  -- [{url, position}]
amenities TEXT[]
is_published BOOL DEFAULT FALSE
is_cancelled BOOL DEFAULT FALSE
created_at TIMESTAMPTZ DEFAULT NOW()
```

---

## Test Cases

1. Events tab loads map view by default
2. Event pins visible on map
3. Tap pin → preview card shows above pin
4. Tap preview card → Event Detail opens
5. Tap list toggle → switches to list view
6. Filter chips filter events correctly
7. "X spots left" shows in coral when < 10
8. Tap Book Now → goes to booking flow (Phase 7)
9. Already booked → shows "View My Ticket"
10. Host viewing own event → shows "Manage Event"

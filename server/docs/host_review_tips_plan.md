# Review Tips (planned — not implemented)

Auto-generated "what you could do better" tips, derived from review text via
an LLM, run as a background job (no cost from a paid provider — use a free
OpenRouter model). Two independent tip scopes:

## Per-event tips

- First tip generated once an event crosses **10 reviews**.
- Regenerated every **+5 new reviews** after that (15, 20, 25, ...).
- Each regeneration **replaces** the previous tip for that event — one
  current tip per event, not a history. Patch/overwrite in place.
- Input to the LLM: all review bodies + ratings for that event (or just the
  reviews added since the last generation, if we want to bias toward recent
  feedback — decide at implementation time).

## Per-host (career-wide) tips

- First tip generated once a host crosses **30 reviews total** (summed
  across all their hosted events).
- Regenerated every **+10 new reviews** after that (40, 50, 60, ...).
- Same patch/overwrite behavior — one current tip per host.

## Trigger mechanism

Runs in the background whenever a new review is submitted
(`POST /events/{id}/reviews` in `server/routes/events.py`), not on a cron —
check the new review count against the thresholds above and only fire the
LLM call when a threshold is actually crossed.

## Storage (not yet decided)

Needs a place to persist the current tip text + the review-count it was
generated at (so we know when the next threshold is crossed):
- `events.review_tip` / `events.review_tip_at_count` columns, or
- a separate `event_review_tips` / `host_review_tips` table keyed by
  `event_id` / `host_id`.

## Explicitly out of scope for now

- No paid LLM usage — must use a free-tier OpenRouter model.
- No implementation yet. This file is the spec to build against later.

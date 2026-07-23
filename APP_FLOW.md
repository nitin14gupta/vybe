# Gorave — Full App Flow & Legal Reference

Purpose: a single reference document covering every screen, every permission
requested, the payment/payout mechanics, and every third-party library in use
— so Privacy Policy and Terms of Use can be drafted accurately, and so future
implementation requests have one shared source of truth. Update this file
whenever a screen, permission, or money-flow rule changes.

App was renamed from Vybe to **Gorave** (bundle id `in.gorave.app`, scheme
`gorave`) — brand mentions below use the new name. "Vybe Request" (the
mutual-match request feature between two users) is a separate in-app feature
name, not the company brand, and is left as-is since renaming it is a code
change, not a doc change — flag separately if you want that renamed too.

Last synced with codebase: 2026-07-23.

---

## 1. Navigation flow — splash to home

```
Splash (auth/index.tsx, 2.2s auto-advance)
  → Welcome (auth/welcome.tsx)
    → Phone (auth/phone.tsx)                    [consent text + T&C/Privacy links]
      → OTP (auth/otp.tsx)
        ── new user ──→ Onboarding
        ── existing user ──→ Tabs (home)

Onboarding (all required, in order, cannot skip ahead):
  1. Age gate (onboarding/index.tsx)             "Are you 18+?" Yes/No
  2. Profile (onboarding/profile.tsx)            name, DOB (18+ re-validated), gender, bio
  3. Photos (onboarding/photos.tsx)               [PERMISSION: photo library]
  4. Voice intro (onboarding/voice.tsx)           [PERMISSION: microphone] — skippable
  5. Interests (onboarding/interests.tsx)         pick 3-4 interest chips
  6. Location (onboarding/location.tsx)           [PERMISSION: location] — city search or detect
  7. Complete (onboarding/complete.tsx)           celebratory screen, auto-redirects to Tabs after 5s

Tabs (bottom nav, home = index/home):
  → home (tabs/index.tsx)
  → Events (tabs/events.tsx)
  → Search (tabs/search.tsx)
  → Chat (tabs/chat.tsx)
  → Profile (tabs/profile.tsx)
```

**Notification permission** is NOT a dedicated onboarding screen — it's
requested silently in the background the first time the user is
authenticated (`useNotificationSetup.ts`, mounted app-wide from
`app/_layout.tsx`). No priming screen currently explains *why* before the OS
prompt fires; worth adding a one-line explainer screen if App Store/Play
Store review flags this, but functionally it's already wired.

---

## 2. Permissions requested — what, where, why

| Permission | Screen(s) | Package | Notes |
|---|---|---|---|
| Photo library | `onboarding/photos.tsx`, `profile/edit-photos.tsx`, event cover photo (`Step5Photos.tsx`) | `expo-image-picker` | For profile photos and event cover images |
| Microphone | `onboarding/voice.tsx`, chat voice messages | `expo-audio` | Voice intro (skippable) + voice chat messages |
| Location (foreground) | `onboarding/location.tsx`, Events tab (map/nearby), event creation location picker | `expo-location` | Used for "nearby events", distance display, city detection |
| Push notifications | Background, post-auth (`useNotificationSetup.ts`) | `expo-notifications` | Chat messages, vybe requests, event reminders |
| Camera (live view, not capture-to-library) | `(events)/[id]/scanner.tsx` | `expo-camera` (`CameraView`/`useCameraPermissions`) | Host-side QR ticket scanner at event check-in — a real live camera view, distinct from `expo-image-picker`'s system photo picker used for profile/event photos. Kept intentionally. |

`ios.infoPlist.NSCameraUsageDescription` is set in `app.json`
("Gorave uses your camera to scan QR tickets at event check-in.") — iOS
permission prompt shows a proper reason, not a blank/default one. Android
needs no equivalent usage-description string in `app.json`;
`expo-camera`'s own `AndroidManifest.xml` declares `android.permission.CAMERA`
and merges in automatically via autolinking, no config-plugin entry required.

---

## 3. Full screen inventory

### Auth (`(auth)/`)
- `index.tsx` — splash, animated wordmark, auto-advances to Welcome
- `welcome.tsx` — intro/marketing screen before phone entry
- `phone.tsx` — phone number entry; consent text + Terms/Privacy links (in-app browser); SMS/OTP consent language
- `otp.tsx` — 6-digit OTP verification

### Onboarding (`(onboarding)/`) — see §1 for order
- `index.tsx` (age gate), `profile.tsx`, `photos.tsx`, `voice.tsx`, `interests.tsx`, `location.tsx`, `complete.tsx`

### Tabs (`(tabs)/`)
- `events.tsx` — **Events**: map + list view, search, category filter chips, location-based
- `search.tsx` — **Search** (people search — separate from event search)
- `chat.tsx` — **Chat**: conversation list (pending/active/locked)
- `profile.tsx` — **My Profile**: own profile view, edit entry point

### Events (`(events)/`)
- `create.tsx` — 5-step host wizard: Basics → When/Capacity → Where → Pricing (flat ₹50 platform fee + host commission breakdown shown) → Photos → Preview
- `published.tsx` — post-publish confirmation
- `[id]/index.tsx` — event detail (share, report, RSVP/book entry)
- `[id]/book.tsx` — booking screen, price breakdown incl. platform fee
- `[id]/payment.tsx` — payment method selection (Razorpay / wallet)
- `[id]/qr-payment.tsx` — UPI QR code payment flow
- `[id]/waitlist.tsx`, `[id]/waitlist-joined.tsx` — waitlist join/status when event is full
- `[id]/attendees.tsx` — guest list (inline-scrolling sheet pattern)
- `[id]/ticket.tsx` — issued ticket / QR for check-in
- `[id]/scanner.tsx` — host-side QR scanner for event check-in
- `[id]/review.tsx`, `[id]/reviews.tsx` — post-event review submission + list
- `[id]/edit.tsx` — host edits a published event

### Profile (`(profile)/`)
- `[id].tsx` — view another user's profile (social engagement: follow, vybe request)
- `edit.tsx`, `edit-photos.tsx` — edit own profile / photos
- `follows.tsx` — followers/following lists
- `location.tsx` — update home city/location

### Search (`(search)/`)
- `index.tsx` — event search modal (relevance-ranked by host relationship — followed/previously-attended hosts rank higher)

### Chat (`(chat)/`)
- `[id].tsx` — 1:1 conversation (text/voice/image/video/gif, reactions, reply, edit within 15 min, unsend, report, block, link previews, in-app browser for shared links)
- Chat only unlocks after a mutual Vybe request is accepted — no messaging before that.

### Settings (`(settings)/`)
- `index.tsx` — settings hub
- `notifications.tsx` — notification preferences
- `blocked.tsx` — manage blocked users
- `my-events.tsx`, `joined-events.tsx` — hosted / attended events lists
- `wallet.tsx` — Gorave Wallet balance, refund credits, transaction history
- `help.tsx` — static FAQ (7 Q&As)
- `feedback.tsx` — free-text feedback form → `ApiService.submitFeedback`
- `support.tsx` — structured support ticket (topic + message) → `ApiService.submitSupport`, plus a `mailto:` fallback to `SUPPORT_EMAIL`
- `delete-account.tsx` — 4-step guided deletion: warning → data-loss summary → phone OTP re-verification → type "DELETE" to confirm; blocked entirely if the user has upcoming hosted events (real server-side check, not just UI — see §8a for what deletion actually does today)
- `about.tsx` — version info, **Privacy Policy / Terms of Use / Open Source Licenses** links (all open the in-app browser or a dedicated screen)
- `privacy.tsx`, `terms.tsx` — open the in-app browser (WebView) directly to the hosted legal pages; currently pointed at placeholder URLs (see §5)
- `open-source.tsx` — credits list of third-party open-source libraries in use

---

## 4. Money flow — tickets, platform fee, refunds

- **Ticket pricing**: hosts set a price ≥ ₹99 (or free — capped at 2 free
  events/month per host) in event creation Step 4.
- **Platform fee (attendee-facing)**: a **flat ₹50**, added on top of the
  ticket price — no longer a percentage. Example: host sets ₹1,000 →
  attendee is charged ₹1,050 total (₹1,000 ticket + ₹50 platform fee).
  Attendees only ever see this flat ₹50 fee; they never see the host's
  commission cut below.
- **Host commission (host-facing only)**: **10%** of the ticket price,
  deducted from the host's payout — not charged to the attendee. Example:
  a ₹1,000 event nets the host ₹900 after commission (the attendee still
  only paid ₹1,050 total). Shown to the host in Step 4's breakdown text
  ("Attendees pay ₹1,050 total... You receive ₹900 after our 10% platform
  commission") and in the event preview overlay. Attendees never see this
  number — `book.tsx` and `payment.tsx` only ever show the flat ₹50 fee.
- **Per-event snapshot, not a live global rate**: both values are computed
  once — at event creation and again on any edit that changes the price —
  and stored directly on the `events` row (`platform_fee_inr`,
  `host_commission_inr`, `platform_profit_inr` = the two summed, i.e. total
  platform profit per ticket for that event — ₹150 for a ₹1,000 event).
  This means if the flat fee or commission rate changes later, already-
  published events keep charging/paying out at the rate they were created
  under, rather than silently shifting.
- Server-side constants (source of truth): `PLATFORM_FEE_INR = 50` and
  `HOST_COMMISSION_RATE = 0.10` in `server/routes/payments.py`, applied via
  `_fee_snapshot()` in `server/routes/events.py` at create/edit time.
  `server/routes/payments.py`'s `create_order` / `wallet_pay` / `create_qr`
  all charge attendees using the event's own stored `platform_fee_inr`
  column, not the live constant — so a rate change never retroactively
  alters an already-created event's charge.
- Client-side mirror (display only, pre-creation preview where no event row
  exists yet to fetch from): `PLATFORM_FEE_INR`, `HOST_COMMISSION_RATE`,
  `HOST_COMMISSION_PERCENT_LABEL` in `client/src/constants/fees.ts`, used
  only by `Step4Pricing.tsx` and `EventPreviewOverlay.tsx` during the
  create-event flow. Every other screen (`book.tsx`, `payment.tsx` via
  `usePaymentData.ts`) reads `platform_fee_inr` straight off the event
  object returned by the API, not a hardcoded constant.
- **Payment methods**: Razorpay (card/UPI/netbanking), UPI QR code, or
  Gorave Wallet balance (can combine wallet + Razorpay for partial
  payment).
- **Cancellation / refunds**: if a host cancels an event, attendees are
  refunded to their **Gorave Wallet** instantly — the ₹50 platform fee is
  absorbed by Gorave on cancellation (attendee gets back the full ticket
  price, not the fee they paid on top; see `server/routes/events.py` around
  the cancellation-refund logic).
- **Payout to host**: not yet an automated bank-transfer payout system in
  this codebase (no payout endpoint was found) — currently a manual/
  future process. `host_commission_inr`/`platform_profit_inr` on the event
  row give you the numbers to reconcile a manual payout against, but no
  code actually moves money to the host yet. Terms of Use should state
  clearly how and when hosts actually receive their revenue (bank transfer
  cadence, dispute window, KYC requirements) once that process is
  finalized — this is a gap to close before launch, not just a
  documentation task.

---

## 5. Legal pages — current state

- `Privacy Policy` and `Terms of Use` are no longer rendered as in-app
  static text (the old `LegalSheet` component + `legalContent.ts` were
  removed). Both `(settings)/privacy.tsx` and `(settings)/terms.tsx`, plus
  the consent links on the phone entry screen, now open an **in-app
  browser (WebView)** pointed at:
  - Terms: `https://www.uilora.com/terms` *(placeholder — swap for Gorave's real hosted page)*
  - Privacy: `https://www.uilora.com/privacy` *(placeholder — swap for Gorave's real hosted page)*
  - Update both URLs in `client/src/constants/legalLinks.ts` once real pages exist.
- **Support email — single source of truth**: `SUPPORT_EMAIL` in
  `client/src/constants/contact.ts` (currently `support@gorave.com`). Every
  screen that shows or `mailto:`s a support address reads from here —
  `phone.tsx`, `help.tsx`, `support.tsx`, `about.tsx`, `delete-account.tsx`,
  `DeletedAccountSheet.tsx`. Previously these were hardcoded independently
  and had drifted (`support@gorave.in` / `hello@gorave.in` in several places
  vs. `support@gorave.com` in others) — now there's one constant to change
  if the domain ever moves again.
- **Phone screen consent copy** (as implemented):
  > "By clicking Send Code, you agree to our **Terms** and **Privacy
  > Policy** and consent to receive event texts from Gorave. Msg frequency
  > varies; data rates may apply. For help, email us at {SUPPORT_EMAIL}."
  - No SMS keyword auto-reply (STOP/HELP) is implemented — support is
    handled via email instead, per your direction.

### What the real Privacy Policy needs to cover (based on actual data collected)
- Phone number (OTP auth), name, date of birth (18+ gate), gender, bio, city/location
- Profile photos, event cover photos
- Voice intro recordings (optional, skippable)
- Precise/approximate location (for nearby-events, distance display)
- Chat messages, media (images/video/voice notes), link previews (server fetches OG metadata server-side)
- Payment data (handled by Razorpay — clarify Gorave never stores raw card/UPI details, only transaction references)
- Push notification tokens
- Follow graph, Vybe requests, blocks/reports (safety data)
- Event attendance history, reviews given/received
- Data retention & deletion: account deletion is user-initiated (OTP-verified) with a stated 30-day recovery window before permanent erasure (per `delete-account.tsx` copy — confirm this matches actual backend retention behavior before publishing)

### What the real Terms of Use needs to cover
- 18+ minimum age (enforced at signup via age-gate + DOB check)
- User-generated content rules (photos, bio, voice, chat) and prohibited conduct
- Event hosting responsibilities, cancellation policy, refund-to-wallet mechanics
- Platform fee (10%) disclosure, exactly as described in §4
- Payment processing via Razorpay (third-party processor disclaimer)
- Blocking/reporting, account suspension/termination grounds
- SMS/notification consent language (matches phone-screen copy above)
- Limitation of liability, dispute resolution, governing law/jurisdiction (India)

---
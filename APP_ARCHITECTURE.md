# Vybe (Gorave) — Full App Architecture & Flow Reference

> Client root: `client/src` (Expo Router, React Native 0.85, React 19, Expo SDK ~56).
> Internal branding: the wordmark/UI says **"Gorave"** ("Meet. Vibe. Connect."), the package/repo is named **vybe**. Both names appear interchangeably in code (e.g. `useVybeFonts`, but `about.tsx` renders "GORAVE").
> This document was compiled by reading the actual source files (paths cited throughout) so it can be handed to another AI as ground truth for the app's screens, flows, and logic.

---

## 1. Entry Flow: Splash → Welcome → Auth → Routing Gate

### 1.1 Root layout — `client/src/app/_layout.tsx`
Mounted once at boot. Provider nesting: `GestureHandlerRootView` → `KeyboardProvider` → `BottomSheetModalProvider` → `StatusBar` (light) → `RootNavigator` (the actual `Stack`). Global overlays rendered as siblings: `PillOverlay` (toasts), `PermissionSheetOverlay`, `AccountLockedOverlay`, `NoInternetBanner`, `MaintenanceOverlay`, plus a conditional full-screen `AppSplashScreen` shown while `!appReady`.

**Splash sequencing:**
- `SplashScreen.preventAutoHideAsync()` called at module scope to hold the native splash.
- A `useEffect` immediately calls `SplashScreen.hideAsync()` — the *native* splash disappears fast.
- In its place, a custom JS `AppSplashScreen` (`@/components/ui/SplashScreen`) overlays the screen until `appReady = (fontsLoaded || fontError) && authReady`, giving a seamless native→JS splash handoff while fonts (`useVybeFonts()`) and auth bootstrap finish.

**Auth bootstrap (`bootstrap()`, runs once):**
1. `tokenStorage.load()` (SecureStore-backed) loads any persisted session.
2. If a `refreshToken` exists, **always** calls `ApiService.refreshToken(...)` — access tokens are short-lived (~15 min), so a fresh one is fetched unconditionally rather than trusting a stored access token. Comment notes refresh tokens have a ~100-day window.
3. On success: builds `{accessToken, refreshToken, userId, phone, profileComplete}`, persists via `tokenStorage.save`, calls `setAuth(...)` on the Zustand auth store.
4. On failure: `tokenStorage.clear()` → forces user back to login.
5. Either way: `setHydrated(true)` — this is what `app/index.tsx` waits on before routing.

**Routing gate (`RootNavigator`)** uses Expo Router's `Stack.Protected`, keyed on two flags from `useAuthStore`:
- `guard={!isAuthenticated}` → `(auth)` group
- `guard={isAuthenticated && !profileComplete}` → `(onboarding)` group
- `guard={isAuthenticated && profileComplete}` → `(tabs)`, `(events)`, `(chat)`, `(settings)`, `(profile)` groups

There is **no separate `isOnboarded` flag** — `profileComplete` (mirrors server's `profile_complete`) is the sole gate between onboarding and the main app. Host status is a *third*, independent flag (`is_host_onboarding_finished`) checked only when entering event creation (§4.2).

Also wired here: `useNotificationSetup()` (push registration), `useDeepLinkRouter()` (deep links, §7), `useNetworkStatus()`.

### 1.2 Root index route — `client/src/app/index.tsx`
Renders only the splash overlay. Waits for `isHydrated`, then does an imperative `router.replace`:
- `!isAuthenticated` → `/(auth)`
- `isAuthenticated && !profileComplete` → `/(onboarding)`
- else → `/(tabs)`

(Duplicates the `Stack.Protected` logic — its job is just to kick the first `router.replace`.)

### 1.3 Welcome screen — `client/src/app/(auth)/index.tsx`
First screen of the `(auth)` group. City illustration (`assets/images/onboarding/welcome.png`, 48% of screen height) with gradient fade, "Gorave" brand row, animated bottom card:
- Heading **"Find your vibe"**, subheading **"House parties, events & real connections — all in one place"**.
- CTA **"Get Started"** and secondary text **"I already have an account"** — **both route to the same** `/(auth)/phone` screen; there's no separate returning-user path (returning users are actually caught earlier by the root gate in §1.1/1.2, so they never see this screen at all).
- Decorative static page-dots (no swipe pager). Prefetches template images on mount.

### 1.4 Phone entry — `client/src/app/(auth)/phone.tsx`
10-digit India-only number (`+91` hardcoded elsewhere). `isValid = phone.length === 10`. "Send Code" → `handleSendOTP(phone)` (from `useAuth()`) → `router.push('/(auth)/otp', {phone})`. Legal consent text links to Terms/Privacy (in-app browser modal) + support email.

### 1.5 OTP verification — `client/src/app/(auth)/otp.tsx`
6-digit `OTPInput`, **auto-submits** as soon as 6 digits are entered (no explicit tap required, though a disabled-until-complete "Continue" button also exists). Max 3 attempts (`tooManyAttempts`), then blocked until resend. 45-second resend countdown (`useCountdown(45)`).

Special case: an error prefixed `ACCOUNT_DELETED:<date>` triggers a `DeletedAccountSheet` instead of a generic error, informing the user their account was deleted on that date.

On success, `handleVerifyOTP` (in `useAuth`) does **not** explicitly navigate — it calls `store.setAuth(...)` and persists to SecureStore; the `Stack.Protected` guards in the root layout react to the flag change and route automatically to onboarding or tabs.

### 1.6 Auth data flow
- **`client/src/hooks/useAuth.ts`**: `handleSendOTP`, `handleVerifyOTP` (sets auth store + SecureStore on success), `handleLogout` (deregisters push token, calls server logout, then always `clearAuth()` + resets onboarding store + clears cached push-token flag).
- **`client/src/api/auth.ts`**: thin wrappers — `sendOTP`, `verifyOTP`, `refreshToken`, `logout` → all delegate to `ApiService`.
- **Endpoints** (`client/src/api/config.ts`): `SEND_OTP: /auth/send-otp`, `VERIFY_OTP: /auth/verify-otp`, `REFRESH_TOKEN: /auth/refresh`, `LOGOUT: /auth/logout`, `GET_ME: /users/me`.
- **`TokenResponse`** shape: `{access_token, refresh_token, user_id, profile_complete}` — `profile_complete` is the single server-driven source of truth for onboarding status.
- **Silent 401 refresh**: a module-level `_refreshPromise` mutex in `apiService.ts` ensures concurrent 401s (e.g. parallel uploads) share one refresh call. Failure clears auth → guard redirects to `(auth)`.

### 1.7 Auth store & persistence
`client/src/store/auth.ts` — plain (non-`persist`-middleware) Zustand store: `{isAuthenticated, isHydrated, userId, accessToken, refreshToken, phone, profileComplete, dob}`. Persistence is manual and explicit at each mutation site, backed by **`expo-secure-store`** (not AsyncStorage) via `client/src/lib/tokenStorage.ts`, keys: `vy_at`, `vy_rt`, `vy_uid`, `vy_ph`, `vy_pc`. `clearAuth()` also clears the query cache and any pending deep link.

---

## 2. Onboarding (`client/src/app/(onboarding)/`)

Plain `Stack`, no central stepper config — order is implicit in each screen's `router.push` targets. Each screen renders its own `ProgressBar` (`step`/`total=5`).

**Actual order:** `index.tsx` (age gate, unnumbered) → `profile.tsx` (1) → `photos.tsx` (2) → `voice.tsx` (3) → `interests.tsx` (4) → `location.tsx` (5) → `complete.tsx` (none).

**Draft state** — `client/src/store/onboarding.ts` (`useOnboardingStore`, Zustand + `persist`→AsyncStorage, key `vybe-onboarding`): `name, dob, gender, bio, photoUris[], voiceUri, interests[], city, lat, lng` + `setField`/`reset`. This is a local draft cache; each screen also persists to the server independently.

| Screen | Collects | Validation | On submit |
|---|---|---|---|
| **index.tsx** (age gate) | nothing | — | "18+" → push profile; "not 18" → lock screen, no API call |
| **profile.tsx** (step1) | Full name, DOB (masked `DD/MM/YYYY` or picker), gender, bio | DOB: 8 digits, valid month/day, year≥1900 not future, age≥18 (client + server both enforce 18+); name/bio non-empty trimmed; gender selected | `createProfile({name, dob, gender, bio})` → `POST /users/profile` |
| **photos.tsx** (step2) | Up to 6 photos, `expo-image-picker` | At least 1 photo required (no explicit max beyond 6 slots) | Parallel `uploadPhoto()` calls → `POST /upload/photo` per photo; failed ones marked `error`, blocks nav until resolved |
| **voice.tsx** (step3) | Optional 30s voice intro (`expo-audio`, `Orb` visualizer reacting to live metering) | none — skippable | if recorded: `uploadVoice()` → `POST /upload/voice`; "Skip for now" available only if nothing recorded |
| **interests.tsx** (step4) | 3–4 interests from a list (`GET /places/interests`, 18-item local fallback) | min 3, max 4 (`MAX_INTERESTS=4`) | `setInterests(selected)` → `POST /users/interests`; errors don't block navigation |
| **location.tsx** (step5) | City (searchable list, `GET /places/cities`) + GPS auto-detect (`expo-location`, reverse-geocode, fuzzy city match) | Continue disabled until city set | `setLocation(city, lat, lng)` → `POST /users/location`; errors silently swallowed, navigates regardless |
| **complete.tsx** | nothing (celebration/confetti) | — | No API call. After 5s auto-timer or button tap: `useAuthStore().setProfileComplete(true)` (persists to SecureStore) + `useOnboardingStore().reset()` + `router.replace('/(tabs)')` |

**"Onboarding complete" determination:** purely the client-side `profileComplete` boolean on `useAuthStore`, set once by `complete.tsx`. Server-side source of truth is `profile_complete` on `TokenResponse`/`getMe()`; on relaunch, the bootstrap refresh-token exchange reseeds this flag, so a returning fully-onboarded user is routed straight to `(tabs)` and never sees onboarding again.

---

## 3. Host Onboarding (`client/src/app/(host-onboarding)/`)

Being a "host" = allowed to create ticketed events and receive payouts. Gate flag: **`UserResponse.is_host_onboarding_finished`** — independent of `profileComplete`; a fully onboarded regular user can still be `false` here.

**Trigger:** Tapping the "Create" tab opens `CreateEventSheet` (a bottom sheet, see §4.1) whose confirm action pushes to `/(events)/create`. Inside `(events)/create.tsx`, `useProfile()` loads the profile and an effect checks `!profile.is_host_onboarding_finished` → if true, `router.replace('/(host-onboarding)')` (renders only a `BrandedLoader` until then, blocking the form).

**Steps** (shared `HostProgressBar`, `total=4`, no central data store since only step 4 collects data):
1. **`index.tsx`** — welcome/marketing copy, no data. "Continue" → `reach`.
2. **`reach.tsx`** — informational: events surface automatically in Trending/nearby feeds. "Continue" → `verified-guests`.
3. **`verified-guests.tsx`** — informational: guests are phone-verified. "Continue" → `payout-details`.
4. **`payout-details.tsx`** — the only data-collecting step:
   - `PAYOUT_TABS = ['UPI', 'Bank Account']`, but **Bank Account is deliberately disabled** (pill: "coming soon — use UPI for now"; code comment explains no TDS/TAN obligation exists yet, so bank collection is deferred, though the server schema for it already exists).
   - Field: **UPI ID**, validated via `useVpaValidation` (real round-trip check against Razorpay, resolves and displays the account holder's name; "Save & Finish" disabled until a valid VPA resolves).
   - Submit → `ApiService.savePayoutDetails({payout_method:'upi', upi_id})` → `POST /users/payout-details`, which returns an updated `UserResponse` (server flips `is_host_onboarding_finished` to true — this is the actual completion trigger; there's no separate client flag for it).
   - Shows a ~900ms "You're all set!" screen, then `router.replace('/(events)/create')` — hands control back to event creation, which now passes the gate.

**Data model:** No dedicated `HostProfile` type or host Zustand store exists — host state lives entirely on `UserResponse` (`is_host_onboarding_finished`, payout fields), fetched via `useProfile()`. `PayoutDetailsResponse` includes both `upi_id_masked` and a full (currently unused) `bank_masked` shape.

---

## 4. Tabs (`client/src/app/(tabs)/`)

Tab bar: `index` (Home/Discover), `events`, `create` (intercepted, not a real screen), `chat`, `profile`.

### 4.1 Home / Discover — `(tabs)/index.tsx`
Single `ScrollView`, no in-screen filter tabs. Top-to-bottom:
1. **`TemplateFan`** — decorative animated fan/carousel of static promotional template images (gesture + Reanimated), not event data.
2. **"Create event" button** → opens `CreateEventSheet`; confirming routes to `/(events)/create`.
3. **`MyEventsSection`** — parallel `getMyJoinedEvents()` + `getMyHostedEvents()` (on focus), filtered to non-past/non-cancelled, split into **`UpNextSection`** (attending) and **`HostingSection`** (hosting), ordered by nearer upcoming date.
4. **`RecentlyViewedSection`** — from local `useRecentEventsStore` (device-only history, pruned of ended events on focus) — no API call.
5. **`TrendingSection`** — `getEvents({lat, lng, radius_km:40, limit:30})`, client-side sorted by `attendee_count` descending (code comment: no dedicated "trending" backend signal exists yet). Client-side pagination reveals 6 at a time (`INITIAL_COUNT=6`, `PAGE_SIZE=6`) from the single 30-item fetch. Includes a location self-heal: if profile lat/lng are `(0,0)` but city is set, re-derives coordinates via `getCities()` + `setLocation()`.
6. If everything above is empty → `EmptyState` "Nothing here yet" + Create Event CTA.

**Header** (`AppHeader`, transparent, logo):
- **Search icon** → `router.push('/(profile)/search')` — this is the **people-search entry point**.
- **Notifications icon** (visually a heart, not a bell) → `router.push('/(settings)/notifications')`; shows a red dot when `unreadCount > 0` from `useNotifStore`, refreshed via `getUnreadNotificationCount()` on every focus.
- Double-back-press-to-exit with a toast pill.

### 4.2 People Search — `client/src/app/(profile)/search.tsx`
Search **by name/username only** (no event search here).
- Debounced 400ms (also fires on submit) → `ApiService.searchUsers(query, page=1, limit=10)` → `GET /users/search`.
- Results re-sorted client-side: IDs present in local `useSearchHistoryStore` are boosted to the top.
- Empty query shows a persisted "Recent" history list (removable per-row / clearable).
- Skeleton loading state (7 fake rows).
- Tap result → adds to search-history store, `router.push('/(profile)/${id}')`.
- State resets on unfocus (fresh history shown each time the screen reopens). No infinite scroll — flat list, max 10 per search.

### 4.3 Notifications — `(settings)/notifications.tsx` + `notification-settings.tsx`
- `getNotifications(before?)` (cursor = last item's `created_at`), manual "Load more" pagination (assumes page size 10).
- Grouped into **Today / Yesterday / This Week / Earlier** sections.
- Types: `follow`, `send_vybe`, `message` (actionable — inline Accept/Reply buttons), plus icon fallbacks for `host_onboarding_complete`, `report_submitted`.
- Tap → `markNotificationRead()` (optimistic) + deep-link navigation via `notifEntityToTarget`/`targetToHref`.
- Inline `follow` action optimistically follows via `ApiService.followUser` (reverts on failure).
- `getUnreadNotificationCount()` is really a `> 0` boolean signal (`?unread_only=true&limit=1`), not a true count.
- **`notification-settings.tsx`** — four **push-only** toggle categories (optimistic, revert on failure): **Social** (followers/vybe requests), **Hosting** (RSVPs/sales/sellouts/reviews), **Events you're going to** (changes/cancellations/waitlist openings), **Payments** (confirmations/refunds). Copy clarifies these gate push delivery only, not the in-app list.

### 4.4 Profile tab & related screens — `(tabs)/profile.tsx`, `(profile)/*`
- **Own profile** (`(tabs)/profile.tsx`, `useProfile()` with no id): avatar, host badge, Vibers/Vibing (followers/following) counts → `/(profile)/follows`, Reviews stat, Edit Profile (`/(profile)/edit`), Share Profile (`/(profile)/qr`), bio + voice-intro playback, badges/interests, **Going/Hosted** tab pair (`TabSwitcher`, max 3 shown each, dedicated empty states), photo grid.
- **Other user's profile** (`(profile)/[id].tsx`): full-bleed photo carousel instead of avatar; a **Vybe/connection state machine** drives the sticky CTA: `connected`→"Message", `theySentVybe`→"Accept Vybe" (icebreaker modal → `respondToVibe(accept)`), `isPending`→disabled "Vybe Sent", `isCooldown`→live countdown pill from `cooldown_until`, default→"Send Vybe" (`sendVibe`, handles HTTP 429 cooldown). Separate Follow/Following toggle. Block/unblock/report via `ProfileMenuSheet`; blocked profile shows an overlay with Unblock. Shows mutual-follow count and computed age.
- **`follows.tsx`** — followers + following lists loaded in parallel (`useFollowsList`, instant tab switching), client-side search filter and sort (Recent/A-Z/Z-A/Earliest), per-row report/block (removes from lists locally).
- **`qr.tsx`** — **profile sharing** (not event check-in): builds `buildProfileShareUrl(userId, username)`, QR card, Share / Save / "Share to Chat" actions.
- **`edit.tsx`** — name (**locked 60 days after last change**, server-tracked `name_changed_at`), username (regex `^[a-z0-9_]{3,30}$`, live availability check debounced 400ms), bio, city (read-only, "Change" → `/(profile)/location`), up to 4 badges, up to 4 interests, full voice-intro record/playback/retake flow (max 30s).
- **`edit-photos.tsx`** — grid of up to 6 photo slots, add/replace/remove, preview-then-confirm modal before upload.
- **`location.tsx`** — same city-picker + GPS auto-detect pattern as onboarding's location step, reused here.

### 4.5 Events tab — `(tabs)/events.tsx`
Two view modes persisted to AsyncStorage (`events_view_mode`): **map** (default) / **list**.
- Data via `useEvents()` → `ApiService.getEvents(filters)`: `lat, lng, radius_km(50 initial), category, is_free, date_range('tonight'|'weekend'|'all'), q`, plus viewport bounds (`min/max_lat/lng`, MapLibre-only via `loadInBounds`).
- **Filter chips** (`FILTER_CHIPS`): single-facet only — selecting one clears the others (free vs tonight/weekend vs category are mutually exclusive, not combinable).
- **Search** → `EventSearchModal`.
- **Create (+)** → `CreateEventSheet` → `/(events)/create`.
- **Map view** (`EventsMapView`): dual provider support — `'google'` (react-native-maps, custom dark style, SVG heading-cone) or `'maplibre'` (default; adds a GeoJSON heatmap glow layer under pins, refetches on `onBoundsChange`). Pins are 72×40.5px photo bubbles (event cover or category icon fallback); a horizontal preview strip (max 8 + "+N more" card) syncs with pin taps.
- **List view**: client-side pagination in batches of 8, pull-to-refresh.
- Hardware back button always routes to Discover tab instead of exiting/backing out of the tab.

### 4.6 Create tab — `(tabs)/create.tsx`
This file is a **dead placeholder** — `useEffect(() => router.replace('/(tabs)/'))`, renders `null`. It exists only because Expo Router's `Tabs` requires a screen file per tab name.

**Real logic lives in `(tabs)/_layout.tsx`:** the `create` tab's `tabBarButton.onPress` is overridden to `setCreateOpen(true)` instead of navigating — Expo Router never mounts `create.tsx`. This opens `<CreateEventSheet>`, whose `onCreateEvent` does `router.push('/(events)/create')`. So: tapping Create → bottom sheet → confirm → real event-creation screen (which itself gates on host-onboarding status, §3).

### 4.7 Chat tab — `(tabs)/chat.tsx`
See §6.

---

## 5. Event Lifecycle (`client/src/app/(events)/`)

### 5.1 `create.tsx` — Event Creation (host-onboarding-gated, §3)
5-step wizard (`useCreateEvent()` hook): **Step1Basics** (title, type/category) → **Step2When** (date/time, end time, capacity) → **Step3Where** (location, `LocationPickerMap`) → **Step4Pricing** (free/paid, price + **limit checks**) → **Step5Photos** (cover photo, required).

**Validation / limits (exact rules found in code):**
- Title + event type required (step 1).
- Start time must be **≥ 24 hours** from now; end time after start; duration **1–72 hours**; capacity **5–200** (step 2).
- Location name required (step 3).
- **Free-event quota**: `getFreeSlots()` → `{used, limit, resets_on}`. If marking free and `used >= 2` → blocked ("You've used your 2 free events this month. Set a ticket price."). **Hard-coded to 2 free events/month**; unlimited paid events.
- Non-free events require **price ≥ ₹99**.
- Cover photo required (step 5).

On submit → `router.replace('/(events)/published?id=...&title=...')`.

### 5.2 `published.tsx` — Post-publish
Confetti/rocket celebration; fetches the event for cover+date. Share options: native share (with an off-screen-rendered `EventShareCard` image), "Share in Chat", "Copy Link" (`buildEventShareUrl`). "GO TO MY EVENTS" → `/(settings)/my-events`; "Skip for now" → the event detail page.

### 5.3 `[id]/index.tsx` — Event detail
Fetches event (+ attendees if host, + public guest stack always). Adds to `useRecentEventsStore` (drives §4.1's "Recently viewed").

**Host sticky bar:** price + attendee/capacity count, "Attendees" (→ `attendees.tsx`), and "Scanner" (pre-event) / "Review" (post-event, → `reviews.tsx`). Overflow menu: Edit / Manage Waitlist (if any) / Cancel Event.

**Attendee sticky bar (priority state machine):** cancelled → badge · past+attended → "Reviewed" or "Rate Event" (→ `review.tsx`) · has ticket → "Going ✓" + "Ticket" (→ `ticket.tsx`) · event in progress → disabled · waitlist offer active → live countdown "Spot Reserved!" (min of offer-expiry/event-start) → confirms via RSVP · on waitlist no offer → "On Waitlist #N" (→ `waitlist-joined.tsx`) · waitlist full → disabled · needs waitlist → "Join Waitlist" (may immediately land on waitlist if server says so) · else → "Book Now"/"RSVP Free" → `[id]/book.tsx`.

**Time/eligibility locks:** scanner unlocks ≤3h before start; edit locks <2h before start; **cancel locks <48h before start**; age-restricted events check DOB. A dedicated `CancelledScreen` explains wallet refunds (see §5.10/§8).

### 5.4 `[id]/book.tsx` — Order summary
Loads event + wallet balance. Toggle to apply wallet credit (`walletApplied = min(balance, total)`); `toPay = total - walletApplied`. Free events RSVP directly (`rsvpEvent(id,'going')`, or waitlist if server says so) → ticket screen. Paid events → `payment.tsx?wallet=...`.

### 5.5 `[id]/payment.tsx` — Payment method
Razorpay (`react-native-customui`) integration:
- **Full wallet** (`amountToPay===0`) → `walletPay(id)` directly, no Razorpay.
- **UPI intent** (installed app detection, GPay preferred) or **UPI collect** (VPA entry) → `createPaymentOrder(id, walletApplied)` then Razorpay flow.
- **QR** → `createQrPayment(id, walletApplied)` → `qr-payment.tsx`.
- All non-wallet-only paths finish via `verifyPayment({event_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, wallet_amount})` → `ticket.tsx`.

### 5.6 `[id]/qr-payment.tsx`
Standalone QR flow with expiry countdown (color escalates), listens for push `data.type==='payment_success'` to auto-advance, manual "I've Paid" poll (`getQrStatus`), back-press confirmation warning of payment abandonment.

### 5.7 `[id]/ticket.tsx`
Fetches (and caches) `TicketInfo` incl. `ticket_token`. Renders a perforated ticket card with a **QR encoding `ticket_token`** — this is exactly what the host's scanner reads. Save-to-Photos / Share-Event actions.

### 5.8 `[id]/scanner.tsx` — Host check-in
Camera QR scanner (`expo-camera`) → `checkinAttendee(id, data, 'qr_scan')`, 3s scan-cooldown, colored result banner. Also supports searchable **manual check-in** (`checkinAttendee(id, token, 'manual_host')`, explicitly flagged as "logged" to distinguish from QR scans). Live checked-in count badge.

### 5.9 `[id]/waitlist.tsx` (host) / `waitlist-joined.tsx` (guest)
Host: pending vs offered (live countdown) entries; "Admit Next" → `admitFromWaitlist(id)` starts the next person's confirmation window. Guest: shows queue position, "1 hour to confirm" notice, "Leave Waitlist" → `rsvpEvent(id,'cancel')`.

### 5.10 `[id]/attendees.tsx` (host)
Grouped Going/CheckedIn/NotArrived/Waitlist with filter pills and live counts; scanner shortcut gated by a computed `scannerStatus` window (opens 3h before start).

### 5.11 `[id]/review.tsx` / `reviews.tsx`
Reviewing is **gated to checked-in attendees only** (`my_checked_in_at` must be truthy). 5-star + optional 300-char text → `submitReview`. `reviews.tsx` is the host-facing aggregate view (avg rating + list).

### 5.12 `[id]/edit.tsx`
Reuses the create-flow step components pre-populated from the event. Rules: full lock <2h before start; if `attendee_count>0`, age-restriction and price become hard-locked; capacity can't drop below already-booked count (but *can* increase even when otherwise locked, to admit waitlisters); date changes >7 days from original trigger a "guests get 48h to cancel for full refund" confirmation banner. Saves via `updateEvent` (PATCH), photo re-uploads handled first.

---

## 6. Chat / Messaging (`client/src/app/(chat)/`, `(tabs)/chat.tsx`)

- **List (`(tabs)/chat.tsx`)**: merges active + pending ("vybe") conversations, sorted by last-message time. A flame-icon "Vybe inbox" sheet shows incoming connection requests (`getReceivedVibes`); accept opens an icebreaker modal (`respondToVibe(accept, icebreaker)`), pass declines. Tapping an active row → `(chat)/[id]`; a pending row → `(chat)/pending`. Long-press → block/unblock/report.
- **`pending.tsx`**: one-way "request sent, awaiting acceptance" screen — pure display, no API call.
- **`[id].tsx`** (conversation): built on `useChatScreen`→`useChat` (WS transport) + `useImageViewer` + `useVoiceRecorder`. Message types: text, event, profile, image, voice, video, gif — plus reactions, replies, edits, unsend. **Realtime is a raw native `WebSocket`** (not Socket.IO, despite that dependency existing) to `/ws/chat/{id}?token=`, with exponential-backoff reconnect (paused in background). A second lightweight `/ws/inbox` socket just pings `conversation_updated` to trigger a list refresh (WhatsApp-style live reordering without polling). Optimistic sends, 5-minute local message cache, cursor-based `loadMore`.
- Supports swipe-to-reply, double-tap heart react, long-press emoji/actions menu, voice notes, media send, in-app link previews, block/report sheets.

---

## 7. Deep Linking

**Scheme**: `client/app.json` sets `"scheme": "gorave"` (i.e. `gorave://...`); iOS Universal Links + Android App Links both point at `link.uilora.com`.

**`client/src/lib/deepLink.ts`** — `DeepLinkTarget` union: `event | ticket | wallet | profile | chat | chatList | notifications`.
- `targetToHref()` maps each to a router path (e.g. `profile` → own profile tab if it's the current user, else `/(profile)/{id}`).
- `pushDataToTarget()` maps push-notification payload types (`event, conversation, profile, vybe, payment_success, wallet`) to targets, mirroring the server's push payload shapes.
- `parseIncomingUrl()` parses opened URLs (`gorave://event/{id}`, `.../event/{id}/ticket`, `.../profile/{id}`, `.../chat/{id}`, `.../wallet`, `.../notifications`).
- Share-link builders: `buildProfileShareUrl`, `buildEventShareUrl` (used by QR/share sheets throughout, §4.4/§5.2/§5.7).

**`client/src/hooks/useDeepLinkRouter.ts`** (wired once in root `_layout.tsx`): handles cold start (`Linking.getInitialURL`) and warm start (`Linking.addEventListener('url')`). If the user is already authenticated + onboarded, navigates immediately; otherwise stashes the target in `useDeepLinkStore` (persists across the auth/onboarding flow) and fires it once both flags flip true (with a 0ms deferred push to dodge a guard-swap race). Pending targets are explicitly cleared on logout. Push-notification taps reuse this exact same resolution path — one unified system for links and notifications.

---

## 8. Wallet (`client/src/app/(settings)/wallet.tsx`)

`useWallet()` → `getWallet()` → `{balance, transactions: WalletTransaction[]}` (`{id, amount_inr, type:'credit'|'debit', source:'event_refund'|'ticket_purchase', description, expires_at, created_at}`).
- UI: balance card notes "Credits expire 6 months from date earned"; each row shows an expiry line for credits with `expires_at`.
- **Refund-to-wallet is the cancellation mechanism**: cancelling an event (`[id]/index.tsx`'s `doCancelEvent` → `DELETE /events/:id`, only allowed **≥48h before start**) triggers, server-side, a wallet credit (`source:'event_refund'`) to every paid attendee — the client's `CancelledScreen` copy explicitly confirms this ("refunded to their Gorave Wallet").
- **Spend-only, no cash-out in-app**: wallet balance can only be applied toward future ticket purchases (`payment.tsx`'s `walletApplied`/`walletPay`); there is **no withdrawal-to-bank/UPI flow** in the client — the wallet screen's only "get cash instead" path is a link to Support for a manual bank refund.

---

## 9. Feedback & Support

- **`(settings)/feedback.tsx`**: single free-text field (max 1000 chars, live counter), no rating/category. `submitFeedback(text)` → `POST /feedback` → `{ok}`. Success toast: "Thanks for your feedback! We read everything."
- **`(settings)/support.tsx`**: topic picker (`refund | payment | event | account | other`) + min-10-char message → `submitSupport(topic, message)` → `POST /support`. Distinct endpoint/flow from feedback.

---

## 10. Payout Details — two distinct screens (don't confuse them)

1. **`(host-onboarding)/payout-details.tsx`** — the *editable setup* screen, part of the mandatory host-onboarding gate (§3 step 4). UPI-only (bank disabled). Writes via `savePayoutDetails`.
2. **`(settings)/payout-details.tsx`** — a **read-only viewer**, reachable any time from Settings, not part of any gate. `getPayoutDetails()` → shows masked UPI/bank info or an empty state ("You'll add these the first time you create an event"). **No edit capability here** — editing only happens through host onboarding.

---

## 11. Settings (`client/src/app/(settings)/`)

| Screen | Purpose |
|---|---|
| `index.tsx` | Settings hub (Account/Events/Support/App/Privacy sections), logout (confirm sheet) |
| `about.tsx` | App identity: logo, version/build, "Built for Gen-Z India", links to Privacy/Terms/Open Source |
| `background.tsx` | **Not a user setting** — a static design/QA showcase of the app's `LiquidPlasmaBackground` animated component |
| `blocked.tsx` | Blocked-users list, unblock with confirm |
| `calendar.tsx` | **In-app** month/day view of the user's own joined+hosted events (bucketed locally) — not a device-calendar sync; no `expo-calendar` usage |
| `delete-account.tsx` | 4-step wizard: data-loss warning → OTP identity verify → typed confirmation phrase → `DELETE /users/me`; mentions a 30-day reversal grace period via support email |
| `help.tsx` | Static FAQ (profile visibility, city change, photo/voice deletion, Vibers/Vibing terminology, reporting, account deletion) |
| `joined-events.tsx` | Events **attended** (RSVP'd as guest) — Upcoming/Past tabs |
| `my-events.tsx` | Events **hosted** — same tab structure + "+" create shortcut |
| `notifications.tsx` / `notification-settings.tsx` | In-app notification feed / push-category toggles (§4.3) |
| `open-source.tsx` | Static third-party attributions (also reveals server stack: FastAPI, PostgreSQL, Redis, Razorpay, Twilio, Pillow, OpenCV) |
| `payout-details.tsx` | Read-only payout viewer (§10) |
| `privacy.tsx` / `terms.tsx` | One-liners rendering an in-app WebView of hosted legal pages |
| `support.tsx` | Contact-support form (§9) |
| `feedback.tsx` | Feedback form (§9) |
| `wallet.tsx` | Wallet balance/history (§8) |

---

## 12. Shared Architecture

### API client — `client/src/api/`
- **`config.ts`** — `API_BASE_URL` from `expo-constants`; `APP_SCHEME`, `BUNDLE_ID`, `EAS_PROJECT_ID`, `UNIVERSAL_LINK_DOMAIN`; a single `ENDPOINTS` map for every route; `WS_BASE_URL` derives from the API URL (`https→wss`, `http→ws`).
- **`apiService.ts`** (~1180 lines) — one static-method `class ApiService`; plain `fetch` (no axios) wrapped in a 10s-timeout `fetchWithTimeout`.
  - `handleResponse()` retries once on 401 via a **mutex-protected** `refreshAccessToken()` (concurrent 401s share one refresh call).
  - Global side-channel handling inside `handleResponse`: `checkAccountLocked()` (403 `ACCOUNT_LOCKED` → full-screen lock overlay via `useLockStore`) and `checkMaintenanceMode()` (503 `MAINTENANCE` → `useMaintenanceStore` overlay) — both cross-cutting, not per-screen.
  - File uploads via `expo-file-system`'s `FileSystem.uploadAsync` (multipart).
  - WS URL builders (`getChatWsUrl`, `getInboxWsUrl`) put the token in the querystring since native `WebSocket` can't set custom headers.

### State — `client/src/store/` (all Zustand; several `persist`→AsyncStorage)
`auth`, `onboarding` (draft signup data), `deepLinkStore`, `recentEventsStore`, `searchHistoryStore`, `chatSearchHistoryStore`, `notifStore` (unread badge), `notificationStore` (push permission/token), `lockStore` / `maintenanceStore` (global overlays), `networkStore`, `locationStore` (GPS + heading), `pillStore` (toasts), `permissionSheetStore`, `vybeStore` (sent-request tracking), `flyerThemeStore`, `lastPaymentStore`.

### Notable hooks — `client/src/hooks/`
Auth/session: `useAuth`, `useDeepLinkRouter`, `useNotificationSetup`. Location/maps: `useLocation`, `useLiveLocation`, `useLocationSearch`, `useGoogleMaps`, `useMapLibre` (dual map-provider support is real — both Google Maps and MapLibre are wired). Events: `useCreateEvent`, `useEvents`, `useEventSearch`, `useEventPhotos`, `useEventDateTimePickers`, `useCalendarEvents`. Payments: `usePaymentData`, `useWallet`, `useVpaValidation`, `useInstalledUpiApps`. Media/audio: `useVoiceRecorder`, `useVoiceEdit`, `useVoice`, `useMediaPicker`, `useEditPhotos`, `usePhotos`, `useImageShare`, `useImageViewer`, `useQrShare`. Social: `useFollowsList`, `useInterests`. Chat: `useChat`, `useChatScreen`, `useConversations`, `useChatShareTargets`. Misc: `useSettings`, `useLogoutConfirm`, `useGoBack`, `useNetworkStatus`, `useCountdown`, `useFormatDate`, `useProfile`.

### Types
No dedicated `types/` domain models — everything (`Message`, `Conversation`, `VybeRequest`, `EventSummary/Detail`, `ProfileResponse`, `ExtendedProfile`, `WalletTransaction`, `PaymentOrderResponse`, `AppNotification`, `NotificationPrefs`, `TicketInfo`, `WaitlistEntry`, `EventAttendee/Guest`, `CreateEventPayload`, `DiscoverUser`, etc.) is defined inline in `client/src/api/apiService.ts`. The `client/src/types/` folder only holds an ambient module declaration for the Razorpay `react-native-customui` native module.

### Tech stack (`client/package.json`)
- **Framework**: Expo SDK ~56, React Native 0.85.3, React 19.2.3, `expo-router` (file-based, grouped routes).
- **State**: `zustand` ^5 (no Redux), AsyncStorage-backed `persist` for select stores.
- **Forms/validation**: `zod` ^4; forms are hand-rolled `useState`, no react-hook-form.
- **Maps**: dual stack — `react-native-maps` (Google) + `@maplibre/maplibre-react-native` (vector tiles/heatmap).
- **Payments**: `react-native-razorpay` + `react-native-customui` (UPI/VPA UI kit) — India-focused, UPI-first.
- **Realtime**: chat/inbox use **plain `WebSocket`**, not the `socket.io-client` dependency present in the package (that lib appears unused for chat).
- **Push**: `expo-notifications` + `expo-device`, EAS project ID for Expo push tokens.
- **Animation/gesture**: `react-native-reanimated` ~4.3, `react-native-gesture-handler`, `react-native-keyboard-controller`, `@gorhom/bottom-sheet`, `lottie-react-native`, `react-native-fast-confetti`.
- **Media**: `expo-image(-picker/-manipulator)`, `expo-camera`, `expo-video`, `expo-audio`, `expo-media-library`, `@shopify/react-native-skia`, `react-native-view-shot` (flyer/share-card image generation), `react-native-share`.
- **UI**: `nativewind`/`tailwindcss` alongside plain `StyleSheet`, `lucide-react-native`, `@shopify/flash-list`, `react-native-auto-skeleton`, `react-native-qrcode-svg`, `rn-emoji-keyboard`.
- **Storage/security**: `expo-secure-store` (auth tokens only) + `@react-native-async-storage/async-storage` (everything else).

---

## 13. Cross-Cutting Notes Worth Remembering

- **Two independent "completion" flags**, not one: `profileComplete` (regular onboarding, §2) gates auth→main-app; `is_host_onboarding_finished` (§3) gates entering event creation. A user can be fully onboarded but not yet a host.
- **Event creation has exactly one hard monetization limit found client-side**: 2 free events per month per host (`resets_on`-driven), unlimited paid events at a ₹99 minimum price. No other subscription/tier gating exists in the client.
- **Wallet is refund-only, spend-only** — credits come solely from event cancellations (paid attendees refunded there instead of the original payment method) and are only redeemable against future Gorave tickets; there is no in-app cash-out, only a manual Support request.
- **Reviews require proof of attendance** — only checked-in attendees (`my_checked_in_at` truthy) can leave a review.
- **Cancellation is time-boxed**: events can only be cancelled ≥48 hours before start; editing locks <2 hours before start; large date-shift edits (>7 days) require guests get a 48h full-refund cancellation window.
- **Deep links and push notifications share one resolution path** (`useDeepLinkRouter` / `navigateToTarget`), and both correctly defer/queue themselves if the user isn't authenticated+onboarded yet, replaying once they are.
- **Two settings screens look similar but aren't**: `my-events.tsx` (hosted-by-me) vs `joined-events.tsx` (attended-by-me); `(host-onboarding)/payout-details.tsx` (editable, gate step) vs `(settings)/payout-details.tsx` (read-only viewer).
- **`(tabs)/create.tsx` is a decoy file** — real Create-tab behavior is intercepted in `(tabs)/_layout.tsx`'s custom `tabBarButton`, opening a sheet instead of navigating to that route.

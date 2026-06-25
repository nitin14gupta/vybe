# Vybe — Remaining Work

> Last updated: 2026-06-25
> Tick items off as you go. Grouped by priority.

---

## ✅ Done (this session)

- [x] DB migration — `voice`, `video`, `gif` added to content_type CHECK constraint + `reactions jsonb`
- [x] Redis caching for message fetch (60s TTL, invalidated on new message)
- [x] Server surfaces DB errors to client (`type: error, code: send_failed`)
- [x] `MediaViewerModal` — full-screen image / gif / video with swipe-down + X close
- [x] `useImageViewer` hook
- [x] Failed message UI — red border + "⚠ Failed · Tap to retry"
- [x] `failedIds` + `retryMessage` in `useChat.ts`
- [x] Optimistic media send — spinner overlay while pending
- [x] Video download-first for recipients (tap to download placeholder)
- [x] Long-press profile image → full-screen modal (`profile.tsx` + `(profile)/[id].tsx`)
- [x] Reaction pills — solid dark background, `zIndex: 2 / elevation: 2`
- [x] Emoji picker `+` button opens `rn-emoji-keyboard` full keyboard
- [x] Voice bubble playback fix (removed `seekTo(0)` race, removed `compact` for taller waveform)
- [x] `throw` syntax error in `useChat.ts` (bare throw outside catch binding)

---

## 🔴 Critical — breaks core features

- [ ] **Messages never marked as read**
  - `ApiService.markRead(convId)` exists but is never called
  - Fix: call it in `useChat.ts` when the screen mounts / focuses
  - File: `src/hooks/useChat.ts`

- [ ] **WS `onerror` is empty** — `ws.onerror = () => {}`
  - Silent WS failures; user has no idea connection dropped
  - Fix: log + attempt reconnect / show disconnected banner
  - File: `src/hooks/useChat.ts`

- [ ] **Push notifications not implemented**
  - No `requestPermissionsAsync()`, no device token sent to server
  - No `addNotificationResponseReceivedListener` (tap → navigate to chat)
  - File: `app/_layout.tsx` + server `/devices` endpoint

- [ ] **Token refresh race condition**
  - Two simultaneous 401 responses both call `refreshToken()` — second corrupts stored tokens
  - Fix: add a Promise mutex around the refresh call
  - File: `src/api/apiService.ts`

- [ ] **Onboarding state not persisted**
  - Crash mid-onboarding = start from scratch
  - Fix: add Zustand `persist` middleware to `onboardingStore`
  - File: `src/store/onboarding.ts`

---

## 🟠 High — broken UX

- [ ] **Conversation list has no error state**
  - Network fail and empty list look identical to user
  - File: `app/(tabs)/chat.tsx`

- [ ] **Accept / Pass vybe errors silently swallowed** — `.catch(() => {})`
  - Action fires, card disappears, but API call may have failed
  - File: `app/(tabs)/chat.tsx`

- [ ] **Discover swipe/follow errors silently swallowed**
  - File: `app/(tabs)/index.tsx`

- [ ] **No offline indicator anywhere**
  - User sends message with no internet; no feedback until retry UI
  - Fix: `expo-network` + a banner/toast when offline
  - File: global in `app/_layout.tsx`

- [ ] **Block/unblock errors not handled in chat**
  - UI says "You blocked this person" even if API failed
  - File: `app/(chat)/[id].tsx`

- [ ] **GIF search (Tenor/GIPHY)**
  - Current GIF button only opens photo library
  - For proper search: Tenor API (free, needs API key) + search modal
  - File: `components/chat/ChatInputBar.tsx` + new `GifSearchModal.tsx`

---

## 🟡 Medium — polish / performance

- [ ] **No haptic feedback anywhere**
  - `expo-haptics` not used on any swipe, send, reaction, follow, RSVP
  - File: everywhere — start with `useChatScreen.ts` (send + reaction)

- [ ] **`estimatedItemSize` missing on all FlatLists**
  - Causes janky scroll on Android; easy 1-line fix per list
  - Files: all screens with FlatList / FlashList

- [ ] **`loadMore` can spam on scroll**
  - `onEndReached` fires rapidly; no in-flight guard
  - Fix: `loadingMore` ref check before fetching
  - File: `src/hooks/useChat.ts`

- [ ] **No pull-to-refresh on own profile**
  - Stale profile data if updated elsewhere
  - File: `app/(tabs)/profile.tsx`

- [ ] **No pull-to-refresh on other user profile**
  - File: `app/(profile)/[id].tsx`

- [ ] **CTA buttons not disabled during API calls**
  - "Send Vybe" / "Follow" can be double-tapped
  - File: `app/(profile)/[id].tsx`

- [ ] **No request timeout on fetch calls**
  - App hangs forever if server is unresponsive
  - Fix: `AbortController` with 15s timeout in `apiService.ts`
  - File: `src/api/apiService.ts`

- [ ] **RSVP button spammable**
  - File: events screen

- [ ] **Unsaved changes warning on event form back**
  - File: event create/edit screens

- [ ] **Logout has no confirmation dialog**
  - One tap = logged out, no undo
  - File: `app/(settings)/index.tsx`

- [ ] **OTP error parsing broken**
  - Code uses `e?.response?.data?.detail` (axios syntax) — app uses `fetch`
  - All OTP errors show generic message even for real server errors
  - File: `src/api/apiService.ts` OTP verify handler

---

## 🟢 Low — polish

- [ ] **No global error boundary**
  - Unhandled render error = white screen with no recovery
  - Fix: wrap `app/_layout.tsx` children in `<ErrorBoundary>`
  - File: `app/_layout.tsx`

- [ ] **No skeleton/shimmer loaders**
  - Only spinners; Discover card stack, profiles, events need shimmer
  - Suggested lib: `react-native-skeleton-placeholder` or manual `Animated` bars

- [ ] **No blurhash image placeholders**
  - Blank space while images load; `expo-image` supports `placeholder` prop natively
  - Files: all screens with `<Image>` from expo-image

- [ ] **`useHardwareBack` missing on most screens**
  - Only 2 screens handle Android back button
  - Files: auth, onboarding, chat, settings screens

- [ ] **No accessibility labels on any interactive element**
  - App is completely inaccessible to screen readers
  - Files: everywhere — start with tab bar + chat actions

- [ ] **Notification unread count starts at 0, never synced**
  - `notifStore` initialises at 0 and never fetches real count from API
  - File: `app/_layout.tsx` on mount

- [ ] **WS keeps reconnecting in background**
  - Drains battery/data when app is minimised
  - Fix: listen to `AppState` change → pause/resume WS
  - File: `src/hooks/useChat.ts`

- [ ] **Onboarding state not cleared on logout**
  - Previous user's data bleeds into next login
  - Fix: call `onboardingStore.reset()` in logout handler
  - File: `src/api/apiService.ts` logout or `app/_layout.tsx`

---

## 💡 New Feature Ideas (not bugs)

- [ ] **GIF search** — Tenor API integration in chat input
- [ ] **Message reactions with animation** — pop/bounce when reaction added
- [ ] **Read receipts UI** — double-tick / seen avatar under last message
- [ ] **Image blurhash** — generate on upload, store in metadata, show as placeholder
- [ ] **Voice message scrubbing** — seek bar in VoiceBubble (use `status.currentTime / status.duration`)
- [ ] **Deep links** — `vybe://chat/:id`, `vybe://profile/:id` for notification taps
- [ ] **Message search** — search within a conversation
- [ ] **Stickers / emoji enlargement** — single emoji message renders big (WhatsApp style)

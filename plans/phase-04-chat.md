# Phase 4 — Chat Tab

## Goal
Build the chat tab: connection list, direct message thread, and event group chat. Real-time via WebSocket or long-poll.

---

## Screens

### Chat List (main)
**Header**: "Messages" left 22pt bold. No right action. Search bar pinned below header (always visible).

**Chat rows**:
- 72px circular avatar, green online dot overlay
- Name 16pt semibold
- Last message preview 14pt muted, 1 line truncated
- Timestamp top-right muted
- Unread badge (orange circle with count)

**Sections**:
- Direct messages — individual connections
- Event group chats — below DMs with separator
- Event groups: event name + "X members"
- Search filters both sections live

### Chat Thread — DM (full screen)
**Header**: Back arrow left. Centre: 40px circular avatar + [Name] semibold + "● Online" green or "last seen X ago" muted. Right: three-dot menu → Report / Block / View Profile.

**Messages**:
- Sent: right-aligned, orange-tinted bg, orange border 0.3 opacity
- Received: left-aligned, surface colour bg
- Timestamp below each bubble
- Typing indicator: 3 bouncing dots (received side)
- Tap avatar → opens their profile

**Input bar** (sticky bottom):
- Attach icon left (share event / share profile)
- Text input pill shape, expandable multiline
- Microphone icon — hold to record voice message
- Send button orange, disabled when empty
- Keyboard awareness

**Special message types**:
- Voice bubble: waveform bar + play/pause + duration. Unplayed=grey, played=orange
- Event share: mini event card with "View Event" button
- Profile share: mini profile card with "View Profile" button

### Event Group Chat (full screen)
**Header**: Back left. Centre: 40px event photo circle + [Event Name] + "X members". Right: info icon → member list + event details.

**Differences from DM**:
- Pinned message at top (collapsible) — event address + date reminder
- Host messages have "Host" orange badge beside name
- Name shown above each received bubble
- Photo sharing enabled
- Host can pin announcements
- Auto-created on first booking, archived 48h after event ends

---

## API Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/conversations` | list all conversations with last message + unread count |
| GET | `/conversations/{id}/messages` | paginated messages, newest last |
| POST | `/conversations/{id}/messages` | send text message |
| POST | `/conversations/{id}/voice` | upload + send voice message |
| WebSocket | `ws://…/ws/chat/{user_id}` | real-time delivery |
| PATCH | `/conversations/{id}/read` | mark as read |

---

## DB Tables

```sql
-- conversations
id UUID PK
type TEXT  -- dm | event_group
event_id UUID → events.id (nullable, for group chats)
created_at TIMESTAMPTZ

-- conversation_members
conversation_id UUID → conversations.id
user_id UUID → users.id
joined_at TIMESTAMPTZ
last_read_message_id UUID

-- messages
id UUID PK
conversation_id UUID → conversations.id
sender_id UUID → users.id
type TEXT  -- text | voice | event_share | profile_share
content TEXT
media_url TEXT  -- voice file URL
metadata JSONB  -- for shares: { event_id } or { profile_id }
created_at TIMESTAMPTZ
```

---

## Real-time Strategy
- WebSocket per connected user. On new message: push to all members of that conversation.
- Fallback: long-poll `GET /conversations?since={timestamp}` every 5s when WS unavailable.

---

## Test Cases

1. Chat list shows all connections with last message preview
2. Unread badge shows correct count
3. Search filters conversations live
4. DM thread loads messages in correct order
5. Send text message → appears immediately (optimistic update)
6. Receive message from other user in real-time (no refresh needed)
7. Typing indicator shows when other user is typing
8. Hold microphone button → records voice, releases → sends voice bubble
9. Play voice message → waveform plays, status changes to played (orange)
10. Attach → share event card → recipient sees mini event card with "View Event"
11. Event group chat: pinned message visible at top
12. Host badge visible on host messages in group chat
13. Group chat archived after event ends + 48h

import * as Linking from 'expo-linking'
import { APP_SCHEME } from '@/api/config'

// Canonical "where a link/notification points" — the single source of truth
// consumed by push-notification taps, in-app notification-row taps, and
// externally-opened links (vybe:// now, https://link.uilora.com/... later).
export type DeepLinkTarget =
  | { screen: 'event'; id: string }
  | { screen: 'ticket'; id: string }
  | { screen: 'wallet' }
  | { screen: 'profile'; id: string }
  | { screen: 'chat'; id: string }
  | { screen: 'chatList' }
  | { screen: 'notifications' }

// `currentUserId` lets a "profile" target route to the own-profile tab
// (`(tabs)/profile`) instead of the other-user viewer screen (`(profile)/[id]`)
// when the link/notification points at yourself.
export function targetToHref(t: DeepLinkTarget, currentUserId?: string | null): string {
  switch (t.screen) {
    case 'event': return `/(events)/${t.id}`
    case 'ticket': return `/(events)/${t.id}/ticket`
    case 'wallet': return '/(settings)/wallet'
    case 'profile': return t.id === currentUserId ? '/(tabs)/profile' : `/(profile)/${t.id}`
    case 'chat': return `/(chat)/${t.id}`
    case 'chatList': return '/(tabs)/chat'
    case 'notifications': return '/(settings)/notifications'
  }
}

// Maps the `data` payload shape sent by server/utils/push.py's send_push() call
// sites (server/routes/*.py) to a canonical target.
export function pushDataToTarget(data: any): DeepLinkTarget | null {
  if (!data?.type) return null
  switch (data.type) {
    case 'event':
      return data.event_id ? { screen: 'event', id: data.event_id } : null
    case 'conversation':
      return data.conv_id ? { screen: 'chat', id: data.conv_id } : null
    case 'profile':
      return data.user_id ? { screen: 'profile', id: data.user_id } : null
    case 'vybe':
      return { screen: 'chatList' }
    case 'payment_success':
      return data.event_id ? { screen: 'ticket', id: data.event_id } : null
    case 'wallet':
      return { screen: 'wallet' }
    default:
      return null
  }
}

// Maps a notification row's entity_type/entity_id (server/routes/notifications.py)
// to the same canonical target.
export function notifEntityToTarget(entityType: string | null, entityId: string | null): DeepLinkTarget | null {
  if (!entityId) return null
  if (entityType === 'event') return { screen: 'event', id: entityId }
  if (entityType === 'user') return { screen: 'profile', id: entityId }
  return null
}

// Builds the shareable profile link embedded in QR codes / share sheets —
// keyed by username (stable, human-readable; server/routes/users.py's
// GET /{user_id}/profile resolves either a username or an id), falling back
// to the id for the rare user who hasn't been assigned one yet.
export function buildProfileShareUrl(userId: string, username?: string | null): string {
  return `${APP_SCHEME}://profile/${username || userId}`
}

// Builds the shareable event link — path must stay singular ("event", not
// "events") to match parseIncomingUrl below.
export function buildEventShareUrl(eventId: string): string {
  return `${APP_SCHEME}://event/${eventId}`
}

// Parses an externally-opened URL (vybe://event/123, and later
// https://link.uilora.com/event/123 — same path shape, different scheme/host)
// into a canonical target.
export function parseIncomingUrl(url: string): DeepLinkTarget | null {
  let path: string | null
  try {
    path = Linking.parse(url).path
  } catch {
    return null
  }
  const [segment, id, sub] = (path ?? '').split('/').filter(Boolean)
  switch (segment) {
    case 'event':
      if (!id) return null
      return sub === 'ticket' ? { screen: 'ticket', id } : { screen: 'event', id }
    case 'profile':
      return id ? { screen: 'profile', id } : null
    case 'chat':
      return id ? { screen: 'chat', id } : null
    case 'wallet':
      return { screen: 'wallet' }
    case 'notifications':
      return { screen: 'notifications' }
    default:
      return null
  }
}

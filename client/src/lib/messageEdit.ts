import type { Message } from '@/api/apiService'

// Keep in sync with EDIT_WINDOW_MINUTES in server/routes/chat.py — the server
// is the real gatekeeper, this is just for UI (hiding the option once it's
// pointless, and giving an immediate error instead of waiting on a 422).
export const EDIT_WINDOW_MS = 15 * 60 * 1000

export function canEditMessage(msg: Message, myId: string | null): boolean {
  if (!myId || msg.sender_id !== myId) return false
  if (msg.content_type !== 'text') return false
  if (msg.unsent_at) return false
  if (msg.id.startsWith('_temp_')) return false
  return Date.now() - new Date(msg.sent_at).getTime() < EDIT_WINDOW_MS
}

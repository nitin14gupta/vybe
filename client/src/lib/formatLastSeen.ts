/** Formats a `last_seen_at` timestamp into "Active 5m ago" / "Active Thursday" / "Active 3w ago". */
export function formatLastSeen(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Active just now'
  if (mins < 60) return `Active ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Active ${new Date(isoStr).toLocaleDateString('en-US', { weekday: 'long' })}`
  const weeks = Math.floor(days / 7)
  if (weeks < 52) return `Active ${weeks}w ago`
  return `Active ${Math.floor(weeks / 52)}y ago`
}

/** Recency threshold under which someone counts as "online" from a stale
 * `last_seen_at` snapshot (e.g. a conversation-list row), not a live socket. */
export const RECENTLY_ACTIVE_MS = 2 * 60_000

export function isRecentlyActive(isoStr: string | null): boolean {
  if (!isoStr) return false
  return Date.now() - new Date(isoStr).getTime() < RECENTLY_ACTIVE_MS
}

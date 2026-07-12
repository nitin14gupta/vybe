// Postgres returns timestamptz as "YYYY-MM-DD HH:MM:SS+05" (space separator, no
// minutes on the offset) — not valid ISO 8601, so plain `new Date(str)` parses
// it inconsistently (or as UTC) across JS engines. Normalize before parsing.
export function parseServerDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

// An event counts as "past" only once it has actually ENDED — an event that
// has started but hasn't ended yet is "ongoing", not past. Falls back to
// treating the event as past once it starts if there's no end_time.
export function isEventPast(event: { date_time: string; end_time?: string | null }): boolean {
  const now = new Date()
  const start = parseServerDate(event.date_time)
  if (!start) return false
  if (start >= now) return false // hasn't started yet
  const end = event.end_time ? parseServerDate(event.end_time) : null
  return end ? end < now : true
}

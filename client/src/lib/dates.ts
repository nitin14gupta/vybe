export function parseServerDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

export function isEventPast(event: { date_time: string; end_time?: string | null }): boolean {
  const now = new Date()
  const start = parseServerDate(event.date_time)
  if (!start) return false
  if (start >= now) return false // hasn't started yet
  const end = event.end_time ? parseServerDate(event.end_time) : null
  return end ? end < now : true
}

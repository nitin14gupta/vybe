/**
 * Converts UTC ISO strings (as returned by the API) to local-time formatted strings.
 * All API timestamps are stored and returned as UTC; display should always be local.
 */

function parseUTC(iso: string | null | undefined): Date | null {
  if (!iso) return null
  // Postgres returns "2024-06-20 14:30:00+00" — normalise to valid ISO 8601.
  // Hermes requires ±HH:MM; "+00" (no minutes) returns Invalid Date, so append ":00".
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

export function useFormatDate() {
  /** "20 Jun 2024" */
  const fmtDate = (iso: string | null | undefined): string => {
    const d = parseUTC(iso)
    if (!d) return 'Date TBC'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  /** "02:30 PM" */
  const fmtTime = (iso: string | null | undefined): string => {
    const d = parseUTC(iso)
    if (!d) return ''
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  /** "Thu, 20 June 2024, 02:30 PM" */
  const fmtDateTime = (iso: string | null | undefined): string => {
    const d = parseUTC(iso)
    if (!d) return 'Date TBC'
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /** "3 days away" / "Tomorrow" / "Today" */
  const fmtRelative = (iso: string | null | undefined): string => {
    const d = parseUTC(iso)
    if (!d) return ''
    const diff = d.getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days away`
  }

  /** Raw Date object in local time (useful for comparisons) */
  const toDate = (iso: string | null | undefined): Date | null => parseUTC(iso)

  return { fmtDate, fmtTime, fmtDateTime, fmtRelative, toDate }
}

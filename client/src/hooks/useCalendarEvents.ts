import { useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { parseServerDate } from '@/lib/dates'

export interface DayEvents {
  joined: EventSummary[]
  hosted: EventSummary[]
  /** Every other published event happening that day (any host, any location) that isn't one you're going to or hosting. */
  other: EventSummary[]
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Any date within the target month — returns [firstOfMonth, lastOfMonth] as 'YYYY-MM-DD'.
function monthBounds(monthDate: Date): [string, string] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  return [dateKey(new Date(year, month, 1)), dateKey(new Date(year, month + 1, 0))]
}

export function useCalendarEvents(visibleMonth: Date) {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])
  const [nearby, setNearby] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [monthStart, monthEnd] = monthBounds(visibleMonth)

  const load = useCallback(async () => {
    setError(false)
    let failed = false
    // Deliberately no lat/lng/radius_km here — the calendar is a personal
    // schedule view, not a proximity browse feed. Passing a location used to
    // cap this to a 50km radius, which silently dropped any real event
    // outside that ring (and caused a flicker: results would shrink the
    // moment GPS resolved mid-session). Every published event in the
    // visible month should show up, regardless of distance.
    const [j, h, n] = await Promise.all([
      ApiService.getMyJoinedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getMyHostedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getEvents({
        start_date: monthStart,
        end_date: monthEnd,
        limit: 200,
      }).catch(() => [] as EventSummary[]),
    ])
    setJoined(j)
    setHosted(h)
    setNearby(n)
    setError(failed)
    setLoading(false)
  }, [monthStart, monthEnd])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvents>()
    const get = (k: string) => {
      if (!map.has(k)) map.set(k, { joined: [], hosted: [], other: [] })
      return map.get(k)!
    }
    const mineIds = new Set<string>()
    for (const e of joined) mineIds.add(e.id)
    for (const e of hosted) mineIds.add(e.id)

    for (const e of joined) {
      const d = parseServerDate(e.date_time)
      if (d) get(dateKey(d)).joined.push(e)
    }
    for (const e of hosted) {
      const d = parseServerDate(e.date_time)
      if (d) get(dateKey(d)).hosted.push(e)
    }
    for (const e of nearby) {
      if (mineIds.has(e.id)) continue
      const d = parseServerDate(e.date_time)
      if (d) get(dateKey(d)).other.push(e)
    }
    return map
  }, [joined, hosted, nearby])

  return { eventsByDay, loading, error, reload: load }
}

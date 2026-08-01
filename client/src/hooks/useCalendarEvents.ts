import { useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { parseServerDate } from '@/lib/dates'
import type { CityResponse } from '@/hooks/useCities'

export interface DayEvents {
  joined: EventSummary[]
  hosted: EventSummary[]
  waitlisted: EventSummary[]
  /** Every other published event happening that day (any host, any location) that isn't one you're going to, hosting, or waitlisted for. */
  other: EventSummary[]
}

export interface CalendarFilters {
  showHosted: boolean
  showGoing: boolean
  showWaitlisted: boolean
  /** null = no location restriction ("All") */
  city: CityResponse | null
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  showHosted: true,
  showGoing: true,
  showWaitlisted: true,
  city: null,
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

export function useCalendarEvents(visibleMonth: Date, filters: CalendarFilters = DEFAULT_CALENDAR_FILTERS) {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])
  const [waitlisted, setWaitlisted] = useState<EventSummary[]>([])
  const [nearby, setNearby] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [monthStart, monthEnd] = monthBounds(visibleMonth)
  // Only the city matters for refetching — the Hosted/Going/Waitlisted
  // toggles are applied client-side below (see eventsByDay) so flipping them
  // is instant and never re-hits the network.
  const cityLat = filters.city?.lat
  const cityLng = filters.city?.lng

  const load = useCallback(async () => {
    setError(false)
    let failed = false
    const [j, h, w, n] = await Promise.all([
      ApiService.getMyJoinedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getMyHostedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getMyWaitlistedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getEvents({
        start_date: monthStart,
        end_date: monthEnd,
        limit: 200,
        // No location filter at all by default ("All") — every published
        // event in the visible month shows up regardless of distance. Only
        // when a specific city is picked do we scope "other" to near it.
        ...(cityLat != null && cityLng != null ? { lat: cityLat, lng: cityLng, radius_km: 50 } : {}),
      }).catch(() => [] as EventSummary[]),
    ])
    setJoined(j)
    setHosted(h)
    setWaitlisted(w)
    setNearby(n)
    setError(failed)
    setLoading(false)
  }, [monthStart, monthEnd, cityLat, cityLng])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvents>()
    const get = (k: string) => {
      if (!map.has(k)) map.set(k, { joined: [], hosted: [], waitlisted: [], other: [] })
      return map.get(k)!
    }
    // "Yours" always excludes from the "other" bucket regardless of whether
    // its own section is currently toggled off — hiding the Hosting section
    // shouldn't make your own event reappear as a stranger's event.
    const mineIds = new Set<string>()
    for (const e of joined) mineIds.add(e.id)
    for (const e of hosted) mineIds.add(e.id)
    for (const e of waitlisted) mineIds.add(e.id)

    if (filters.showGoing) {
      for (const e of joined) {
        const d = parseServerDate(e.date_time)
        if (d) get(dateKey(d)).joined.push(e)
      }
    }
    if (filters.showHosted) {
      for (const e of hosted) {
        const d = parseServerDate(e.date_time)
        if (d) get(dateKey(d)).hosted.push(e)
      }
    }
    if (filters.showWaitlisted) {
      for (const e of waitlisted) {
        const d = parseServerDate(e.date_time)
        if (d) get(dateKey(d)).waitlisted.push(e)
      }
    }
    for (const e of nearby) {
      if (mineIds.has(e.id)) continue
      const d = parseServerDate(e.date_time)
      if (d) get(dateKey(d)).other.push(e)
    }
    return map
  }, [joined, hosted, waitlisted, nearby, filters.showGoing, filters.showHosted, filters.showWaitlisted])

  return { eventsByDay, loading, error, reload: load }
}

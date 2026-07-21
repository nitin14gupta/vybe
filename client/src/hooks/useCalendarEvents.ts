import { useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { parseServerDate } from '@/lib/dates'
import { useLiveLocation } from '@/hooks/useLiveLocation'

export interface DayEvents {
  joined: EventSummary[]
  hosted: EventSummary[]
  /** Events happening that day that aren't ones you're going to or hosting — same nearby feed the Events tab uses. */
  other: EventSummary[]
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useCalendarEvents() {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])
  const [nearby, setNearby] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { lat, lng } = useLiveLocation()

  const load = useCallback(async () => {
    setError(false)
    let failed = false
    const [j, h, n] = await Promise.all([
      ApiService.getMyJoinedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getMyHostedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getEvents({ lat, lng, radius_km: 50 }).catch(() => [] as EventSummary[]),
    ])
    setJoined(j)
    setHosted(h)
    setNearby(n)
    setError(failed)
    setLoading(false)
  }, [lat, lng])

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

import { useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { parseServerDate } from '@/lib/dates'

export interface DayEvents {
  joined: EventSummary[]
  hosted: EventSummary[]
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useCalendarEvents() {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    let failed = false
    const [j, h] = await Promise.all([
      ApiService.getMyJoinedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
      ApiService.getMyHostedEvents().catch(() => { failed = true; return [] as EventSummary[] }),
    ])
    setJoined(j)
    setHosted(h)
    setError(failed)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvents>()
    const add = (list: EventSummary[], bucket: keyof DayEvents) => {
      for (const e of list) {
        const d = parseServerDate(e.date_time)
        if (!d) continue
        const k = dateKey(d)
        if (!map.has(k)) map.set(k, { joined: [], hosted: [] })
        map.get(k)![bucket].push(e)
      }
    }
    add(joined, 'joined')
    add(hosted, 'hosted')
    return map
  }, [joined, hosted])

  return { eventsByDay, loading, error, reload: load }
}

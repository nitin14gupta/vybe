import { useState, useCallback, useEffect, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import type { CalendarDaySummary, CalendarDayEvents } from '@/types/api'
import type { CityResponse } from '@/hooks/useCities'
import { usePillStore } from '@/store/pillStore'

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

const EMPTY_DAY: CalendarDayEvents = { joined: [], hosted: [], waitlisted: [], other: [] }

// The grid only ever needs "does this day have a dot" — a cheap month-scoped
// summary covers that. Full event details are fetched lazily, one day at a
// time, only for whichever day is actually selected — not the user's entire
// hosted/joined/waitlisted history up front (that only gets worse as an
// account ages).
export function useCalendarEvents(visibleMonth: Date, selectedDate: Date, filters: CalendarFilters = DEFAULT_CALENDAR_FILTERS) {
  const showPill = usePillStore(s => s.show)
  const [summary, setSummary] = useState<Map<string, CalendarDaySummary>>(new Map())
  const [monthLoading, setMonthLoading] = useState(true)
  const [monthError, setMonthError] = useState(false)

  const [dayRaw, setDayRaw] = useState<CalendarDayEvents>(EMPTY_DAY)
  const [dayLoading, setDayLoading] = useState(true)
  const [dayError, setDayError] = useState(false)

  const [monthStart, monthEnd] = monthBounds(visibleMonth)
  const selKey = dateKey(selectedDate)
  const todayKey = dateKey(new Date())
  const selectedIsPast = selKey < todayKey
  // Only the city matters for refetching — the Hosted/Going/Waitlisted
  // toggles are applied client-side below, so flipping them is instant and
  // never re-hits the network.
  const cityLat = filters.city?.lat
  const cityLng = filters.city?.lng

  const loadMonth = useCallback(async () => {
    setMonthLoading(true)
    try {
      const rows = await ApiService.getCalendarSummary(monthStart, monthEnd, cityLat, cityLng)
      setSummary(new Map(rows.map(r => [r.date, r])))
      setMonthError(false)
    } catch (e: any) {
      setMonthError(true)
      showPill(e?.message || "Couldn't load this month's calendar", 'error')
    } finally {
      setMonthLoading(false)
    }
  }, [monthStart, monthEnd, cityLat, cityLng, showPill])

  useFocusEffect(useCallback(() => { loadMonth() }, [loadMonth]))

  const loadDay = useCallback(async () => {
    if (selectedIsPast) {
      setDayRaw(EMPTY_DAY)
      setDayError(false)
      setDayLoading(false)
      return
    }
    setDayLoading(true)
    try {
      const data = await ApiService.getCalendarDay(selKey, cityLat, cityLng)
      setDayRaw(data)
      setDayError(false)
    } catch (e: any) {
      setDayRaw(EMPTY_DAY)
      setDayError(true)
      showPill(e?.message || "Couldn't load this day's events", 'error')
    } finally {
      setDayLoading(false)
    }
  }, [selKey, selectedIsPast, cityLat, cityLng, showPill])

  useEffect(() => { loadDay() }, [loadDay])

  const hasEventsOnDate = useCallback((key: string) => {
    const s = summary.get(key)
    if (!s) return false
    return (filters.showGoing && s.has_joined) || (filters.showHosted && s.has_hosted) || (filters.showWaitlisted && s.has_waitlisted) || s.has_other
  }, [summary, filters.showGoing, filters.showHosted, filters.showWaitlisted])

  const dayEvents: DayEvents = useMemo(() => ({
    joined: filters.showGoing ? dayRaw.joined : [],
    hosted: filters.showHosted ? dayRaw.hosted : [],
    waitlisted: filters.showWaitlisted ? dayRaw.waitlisted : [],
    other: dayRaw.other,
  }), [dayRaw, filters.showGoing, filters.showHosted, filters.showWaitlisted])

  return {
    hasEventsOnDate,
    monthLoading,
    monthError,
    dayEvents,
    dayLoading,
    dayError,
    reloadMonth: loadMonth,
    reloadDay: loadDay,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { EventSummary, MyEventsPage } from '@/api/apiService'
import type { EventViewMode } from '@/store/eventViewModeStore'
import { usePillStore } from '@/store/pillStore'

export type MyEventsTab = 'upcoming' | 'past'

// Card view shows fewer, larger items per screen; list view is compact so a
// bigger page still feels like "one screenful" — keeps first-load payloads small
// either way.
const PAGE_SIZE: Record<EventViewMode, number> = { card: 6, list: 10 }

// Flicking between Upcoming/Past shouldn't re-hit the API every time — reuse
// each tab's last page for a minute. Screen focus (mount, or navigating back
// after e.g. creating/cancelling an event elsewhere) always bypasses this and
// fetches fresh, since that's exactly when staleness would hide a real change.
const TAB_CACHE_TTL_MS = 60_000

interface TabCacheEntry {
  events: EventSummary[]
  upcomingCount: number
  pastCount: number
  hasMore: boolean
  offset: number
  fetchedAt: number
}

export function useMyEventsList(
  fetchPage: (tab: MyEventsTab, limit: number, offset: number) => Promise<MyEventsPage>,
  viewMode: EventViewMode,
) {
  const showPill = usePillStore(s => s.show)
  const [tab, setTabState] = useState<MyEventsTab>('upcoming')
  const [events, setEvents] = useState<EventSummary[]>([])
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [pastCount, setPastCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const offsetRef = useRef(0)
  const tabRef = useRef(tab)
  tabRef.current = tab
  const limit = PAGE_SIZE[viewMode]
  const cacheRef = useRef<Partial<Record<MyEventsTab, TabCacheEntry>>>({})

  const applyEntry = useCallback((entry: TabCacheEntry) => {
    setEvents(entry.events)
    setUpcomingCount(entry.upcomingCount)
    setPastCount(entry.pastCount)
    setHasMore(entry.hasMore)
    offsetRef.current = entry.offset
  }, [])

  const fetchFresh = useCallback(async (t: MyEventsTab, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const page = await fetchPage(t, limit, 0)
      const entry: TabCacheEntry = {
        events: page.events,
        upcomingCount: page.upcoming_count,
        pastCount: page.past_count,
        hasMore: page.has_more,
        offset: page.events.length,
        fetchedAt: Date.now(),
      }
      cacheRef.current[t] = entry
      if (tabRef.current === t) applyEntry(entry)
    } catch {
      if (tabRef.current === t) {
        setEvents([])
        setHasMore(false)
        showPill("Couldn't load your events, try again", 'error')
      }
    } finally {
      if (isRefresh) setRefreshing(false)
      else setLoading(false)
    }
  }, [fetchPage, limit, applyEntry, showPill])

  // Screen focus / pull-to-refresh — always fresh, cache is only for
  // in-screen tab flicking (see setTab below).
  const load = useCallback((isRefresh = false) => {
    if (isRefresh) delete cacheRef.current[tabRef.current]
    return fetchFresh(tabRef.current, isRefresh)
  }, [fetchFresh])

  // Page size changed (card ↔ list view toggle) — cached pages are the wrong
  // size now, so drop them all and re-fetch the current tab.
  const prevLimit = useRef(limit)
  useEffect(() => {
    if (prevLimit.current === limit) return
    prevLimit.current = limit
    cacheRef.current = {}
    fetchFresh(tabRef.current)
  }, [limit, fetchFresh])

  const setTab = useCallback((t: MyEventsTab) => {
    setTabState(t)
    const cached = cacheRef.current[t]
    if (cached && Date.now() - cached.fetchedAt < TAB_CACHE_TTL_MS) {
      applyEntry(cached)
    } else {
      fetchFresh(t)
    }
  }, [fetchFresh, applyEntry])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const page = await fetchPage(tab, limit, offsetRef.current)
      const nextEvents = [...events, ...page.events]
      const nextOffset = offsetRef.current + page.events.length
      cacheRef.current[tab] = {
        events: nextEvents,
        upcomingCount: page.upcoming_count,
        pastCount: page.past_count,
        hasMore: page.has_more,
        offset: nextOffset,
        fetchedAt: Date.now(),
      }
      setEvents(nextEvents)
      setUpcomingCount(page.upcoming_count)
      setPastCount(page.past_count)
      setHasMore(page.has_more)
      offsetRef.current = nextOffset
    } catch {
      showPill("Couldn't load more events, try again", 'error')
    } finally {
      setLoadingMore(false)
    }
  }, [fetchPage, tab, limit, hasMore, loadingMore, events, showPill])

  return {
    tab, setTab,
    events,
    upcomingCount, pastCount,
    loading, loadingMore, refreshing, hasMore,
    load, loadMore,
  }
}

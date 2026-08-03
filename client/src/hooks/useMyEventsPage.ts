import { useCallback, useState } from 'react'
import type { EventSummary, MyEventsPage } from '@/api/apiService'

const PAGE_SIZE = 6

type Fetcher = (tab: 'upcoming' | 'past', limit: number, offset: number) => Promise<MyEventsPage>

// One tab's paginated slice of My Events / Joined Events. Two instances of
// this (one per tab) run side by side so SwipeableTabs can reveal the other
// tab's real content mid-drag instead of an empty pane.
export function useMyEventsPage(fetcher: Fetcher, tab: 'upcoming' | 'past') {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [pastCount, setPastCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const fetchFirstPage = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    fetcher(tab, PAGE_SIZE, 0)
      .then(res => {
        setEvents(res.events)
        setHasMore(res.has_more)
        setUpcomingCount(res.upcoming_count)
        setPastCount(res.past_count)
        setLoaded(true)
      })
      .catch(() => setEvents([]))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [fetcher, tab])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    fetcher(tab, PAGE_SIZE, events.length)
      .then(res => {
        setEvents(prev => [...prev, ...res.events])
        setHasMore(res.has_more)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [fetcher, tab, events.length, loadingMore, hasMore])

  return { events, loading, refreshing, loadingMore, hasMore, upcomingCount, pastCount, loaded, fetchFirstPage, loadMore }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import ApiService, { type Conversation } from '@/api/apiService'

interface Result {
  /** null until the first page has loaded */
  people: Conversation[] | null
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
}

function stripBlocked(list: Conversation[]): Conversation[] {
  return list.filter(c => !c.block_status || c.block_status === 'none')
}

export function useChatShareTargets(active: boolean, pageSize = 100): Result {
  const [people, setPeople] = useState<Conversation[] | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const fetchingRef = useRef(false)

  useEffect(() => {
    if (!active) { setPeople(null); setHasMore(true); offsetRef.current = 0; return }
    let cancelled = false
    fetchingRef.current = true
    ApiService.getConversations(pageSize, 0, true)
      .then(res => {
        if (cancelled) return
        setPeople(stripBlocked(res.active))
        offsetRef.current = res.active.length
        setHasMore(res.has_more)
      })
      .catch(err => {
        if (cancelled) return
        console.warn('[useChatShareTargets] failed to load mutual list:', err)
        setPeople([])
        setHasMore(false)
      })
      .finally(() => { fetchingRef.current = false })
    return () => { cancelled = true }
  }, [active, pageSize])

  const loadMore = useCallback(() => {
    if (fetchingRef.current || !hasMore || people === null) return
    fetchingRef.current = true
    setLoadingMore(true)
    ApiService.getConversations(pageSize, offsetRef.current, true)
      .then(res => {
        setPeople(prev => [...(prev ?? []), ...stripBlocked(res.active)])
        offsetRef.current += res.active.length
        setHasMore(res.has_more)
      })
      .catch(err => console.warn('[useChatShareTargets] failed to load more:', err))
      .finally(() => { fetchingRef.current = false; setLoadingMore(false) })
  }, [hasMore, pageSize, people])

  return { people, loadingMore, hasMore, loadMore }
}

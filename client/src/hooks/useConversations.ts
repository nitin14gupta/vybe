import { useState, useCallback, useRef, useEffect } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { Conversation, VybeRequest } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { loadOrCreateKeypair, decryptText } from '@/lib/e2ee'

const PAGE_SIZE = 20

function decryptPreview(conv: Conversation): Conversation {
  if (conv.last_message_type !== 'text' || !conv.last_message) return conv
  return { ...conv, last_message: decryptText(conv.last_message, conv.partner_public_key) }
}

const byRecent = (a: Conversation, b: Conversation) =>
  (b.last_sent_at ?? b.last_message_at ?? '').localeCompare(
    a.last_sent_at ?? a.last_message_at ?? '',
  )

export function useConversations() {
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([])
  const [lockedConversations, setLockedConversations] = useState<Conversation[]>([])
  const [pendingVibes, setPendingVibes] = useState<VybeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)
  const loadingMoreRef = useRef(false)

  const refresh = useCallback(async () => {
    setError(false)
    try {
      await loadOrCreateKeypair()
      const [convData, vibeData] = await Promise.all([
        ApiService.getConversations(PAGE_SIZE, 0),
        ApiService.getReceivedVibes(),
      ])
      setActiveConversations([...convData.active].sort(byRecent).map(decryptPreview))
      setLockedConversations([...convData.locked].sort(byRecent).map(decryptPreview))
      setHasMore(convData.has_more)
      setPendingVibes([...vibeData].sort((a, b) => b.created_at.localeCompare(a.created_at)))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const convData = await ApiService.getConversations(PAGE_SIZE, activeConversations.length)
      setActiveConversations(prev => {
        const seen = new Set(prev.map(c => c.id))
        const fresh = convData.active.filter(c => !seen.has(c.id)).map(decryptPreview)
        return [...prev, ...fresh].sort(byRecent)
      })
      setHasMore(convData.has_more)
    } catch {
      // keep hasMore as-is — user can retry by scrolling again
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [hasMore, activeConversations.length])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  // Live reorder — a lightweight ping from the server (see server/routes/chat.py
  // _notify_inbox) whenever any of the user's conversations gets a new message,
  // so the list bumps to the top in realtime like WhatsApp without polling.
  useEffect(() => {
    const { accessToken } = useAuthStore.getState()
    if (!accessToken) return

    let ws: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0
    let closedByUs = false

    const connect = () => {
      ws = new WebSocket(ApiService.getInboxWsUrl(accessToken))
      ws.onopen = () => { retryCount = 0 }
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data as string)
          if (data.type === 'conversation_updated') refresh()
        } catch {}
      }
      ws.onclose = () => {
        if (closedByUs || retryCount >= 10) return
        const delay = Math.min(1000 * 2 ** retryCount, 30000)
        retryCount++
        retryTimer = setTimeout(connect, delay)
      }
      ws.onerror = () => {}
    }
    connect()

    return () => {
      closedByUs = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
    }
  }, [refresh])

  const acceptVybe = useCallback(async (vibeId: string, icebreaker: string): Promise<void> => {
    await ApiService.respondToVibe(vibeId, 'accept', icebreaker)
    await refresh()
  }, [refresh])

  const passVybe = useCallback(async (vibeId: string): Promise<void> => {
    await ApiService.respondToVibe(vibeId, 'pass')
    setPendingVibes(prev => prev.filter(v => v.id !== vibeId))
  }, [])

  return {
    activeConversations,
    lockedConversations,
    pendingVibes,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    acceptVybe,
    passVybe,
  }
}

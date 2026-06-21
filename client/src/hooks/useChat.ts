import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import ApiService, { Message } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTempIds = useRef<Set<string>>(new Set())
  const isBackgrounded = useRef(false)
  const myId = useAuthStore.getState().userId

  // Initial load + mark read
  useEffect(() => {
    ApiService.getMessages(conversationId)
      .then(msgs => {
        setMessages(msgs)
        setLoading(false)
        ApiService.markRead(conversationId).catch(() => {})
      })
      .catch(() => setLoading(false))
  }, [conversationId])

  const connect = useCallback(() => {
    if (isBackgrounded.current) return
    const { accessToken } = useAuthStore.getState()
    if (!accessToken || !conversationId) return

    const url = ApiService.getChatWsUrl(conversationId, accessToken)
    const ws = new WebSocket(url)

    ws.onopen = () => {
      retryCountRef.current = 0
      setIsWsConnected(true)
    }

    ws.onmessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data as string)
        if (data.type === 'message') {
          setMessages(prev => {
            // If I sent this and there's a pending optimistic message, swap it out
            if (data.sender_id === myId && pendingTempIds.current.size > 0) {
              const tempIdx = prev.findIndex(m => m.id.startsWith('_temp_') && m.sender_id === myId)
              if (tempIdx !== -1) {
                const next = [...prev]
                pendingTempIds.current.delete(prev[tempIdx].id)
                next[tempIdx] = data as Message
                return next
              }
            }
            if (prev.some(m => m.id === data.id)) return prev
            return [data as Message, ...prev]
          })
        } else if (data.type === 'typing') {
          if (data.user_id !== myId) {
            setIsPartnerTyping(!!data.is_typing)
            if (data.is_typing) {
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
              typingTimerRef.current = setTimeout(() => setIsPartnerTyping(false), 3000)
            }
          }
        } else if (data.type === 'online') {
          setIsPartnerOnline(!!data.is_online)
        }
      } catch {}
    }

    ws.onclose = () => {
      setIsWsConnected(false)
      if (!isBackgrounded.current && retryCountRef.current < 10) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
        retryCountRef.current++
        retryTimerRef.current = setTimeout(() => connect(), delay)
      }
    }

    ws.onerror = () => {}

    wsRef.current = ws
  }, [conversationId, myId])

  // Pause reconnection when app goes to background; resume + reconnect on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        isBackgrounded.current = true
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      } else if (state === 'active') {
        isBackgrounded.current = false
        const ws = wsRef.current
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          retryCountRef.current = 0
          connect()
        }
      }
    })
    return () => sub.remove()
  }, [connect])

  useEffect(() => {
    connect()
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback(async (content: string, contentType = 'text', metadata?: object): Promise<void> => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Optimistic: add temp message immediately so UI is instant
      const tempId = `_temp_${Date.now()}`
      const optimistic: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: myId ?? '',
        content,
        content_type: contentType as Message['content_type'],
        metadata: metadata ?? null,
        sent_at: new Date().toISOString(),
        read_at: null,
      }
      pendingTempIds.current.add(tempId)
      setMessages(prev => [optimistic, ...prev])
      ws.send(JSON.stringify({ type: 'message', content, content_type: contentType, metadata }))
      return
    }
    // Fallback: REST — throws on failure so caller can surface error
    const msg = await ApiService.sendMessage(conversationId, content, contentType, metadata)
    setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]))
  }, [conversationId, myId])

  const sendTyping = useCallback((isTyping: boolean) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', is_typing: isTyping }))
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (messages.length === 0) return
    const oldest = messages[messages.length - 1]
    try {
      const older = await ApiService.getMessages(conversationId, oldest.sent_at)
      if (older.length > 0) {
        setMessages(prev => [...prev, ...older])
      }
    } catch {}
  }, [conversationId, messages])

  return {
    messages,
    isPartnerTyping,
    isPartnerOnline,
    isWsConnected,
    loading,
    sendMessage,
    sendTyping,
    loadMore,
  }
}

import { useState, useEffect, useRef, useCallback } from 'react'
import ApiService, { Message } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const myId = useAuthStore.getState().userId

  // Initial load
  useEffect(() => {
    ApiService.getMessages(conversationId)
      .then(msgs => {
        setMessages(msgs) // API returns newest first; inverted FlatList uses this order
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [conversationId])

  const connect = useCallback(() => {
    const { accessToken } = useAuthStore.getState()
    if (!accessToken || !conversationId) return

    const url = ApiService.getChatWsUrl(conversationId, accessToken)
    const ws = new WebSocket(url)

    ws.onopen = () => {
      retryCountRef.current = 0
    }

    ws.onmessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data as string)
        if (data.type === 'message') {
          setMessages(prev => {
            // Avoid duplicates
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
      if (retryCountRef.current < 10) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
        retryCountRef.current++
        retryTimerRef.current = setTimeout(() => connect(), delay)
      }
    }

    ws.onerror = () => {}

    wsRef.current = ws
  }, [conversationId, myId])

  useEffect(() => {
    connect()
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((content: string, contentType = 'text', metadata?: object) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', content, content_type: contentType, metadata }))
      return Promise.resolve()
    }
    // Fallback: REST
    return ApiService.sendMessage(conversationId, content, contentType, metadata).then(msg => {
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]))
    })
  }, [conversationId])

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
    loading,
    sendMessage,
    sendTyping,
    loadMore,
  }
}

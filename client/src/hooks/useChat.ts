import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import ApiService, { Message } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const [isPartnerRecording, setIsPartnerRecording] = useState(false)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const [wsError, setWsError] = useState<string | null>(null)
  const [partnerSeenAt, setPartnerSeenAt] = useState<string | null>(null)
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTempIds = useRef<Set<string>>(new Set())
  const noMoreRef = useRef(false)
  const isBackgrounded = useRef(false)
  const myId = useAuthStore.getState().userId

  // Initial load + mark read
  useEffect(() => {
    noMoreRef.current = false
    ApiService.getMessages(conversationId)
      .then(msgs => {
        setMessages(msgs)
        setLoading(false)
        ApiService.markRead(conversationId).catch(() => {})
        const firstRead = msgs.find(msg => msg.sender_id === myId && msg.read_at != null)
        if (firstRead) {
          setPartnerSeenAt(firstRead.read_at)
        }
      })
      .catch(() => setLoading(false))
  }, [conversationId])

  const applyReactionUpdate = useCallback((messageId: string, userId: string, emoji: string | null) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      const curr = { ...(m.reactions ?? {}) }
      if (emoji) curr[userId] = emoji
      else delete curr[userId]
      return { ...m, reactions: Object.keys(curr).length > 0 ? curr : null }
    }))
  }, [])

  const markTempFailed = useCallback((messages: Message[]) => {
    const tempMsg = messages.find(m => m.id.startsWith('_temp_') && m.sender_id === myId && pendingTempIds.current.has(m.id))
    if (tempMsg) {
      pendingTempIds.current.delete(tempMsg.id)
      setFailedIds(prev => new Set([...prev, tempMsg.id]))
    }
  }, [myId])

  const connect = useCallback(() => {
    if (isBackgrounded.current) return
    const existing = wsRef.current
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return
    }

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
            if (data.sender_id !== myId) {
              const liveWs = wsRef.current
              if (liveWs && liveWs.readyState === WebSocket.OPEN) {
                liveWs.send(JSON.stringify({ type: 'read' }))
              }
            }
            return [data as Message, ...prev]
          })
        } else if (data.type === 'error') {
          if (data.code === 'blocked') {
            setWsError('blocked')
          } else if (data.code === 'send_failed') {
            setMessages(prev => {
              markTempFailed(prev)
              return prev
            })
          }
        } else if (data.type === 'typing') {
          if (data.user_id !== myId) {
            const mode: string = data.mode ?? 'text'
            if (mode === 'voice') {
              setIsPartnerRecording(!!data.is_typing)
            } else {
              setIsPartnerTyping(!!data.is_typing)
              if (data.is_typing) {
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
                typingTimerRef.current = setTimeout(() => setIsPartnerTyping(false), 3000)
              }
            }
          }
        } else if (data.type === 'online') {
          setIsPartnerOnline(!!data.is_online)
        } else if (data.type === 'read') {
          if (data.user_id !== myId) {
            setPartnerSeenAt(new Date().toISOString())
          }
        } else if (data.type === 'reaction') {
          applyReactionUpdate(data.message_id, data.user_id, data.emoji ?? null)
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
  }, [conversationId, myId, applyReactionUpdate, markTempFailed])

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
      reactions: null,
    }
    pendingTempIds.current.add(tempId)
    setMessages(prev => [optimistic, ...prev])

    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'message', content, content_type: contentType, metadata }))
      } catch {
        pendingTempIds.current.delete(tempId)
        setFailedIds(prev => new Set([...prev, tempId]))
      }
      return
    }

    // REST fallback
    try {
      const msg = await ApiService.sendMessage(conversationId, content, contentType, metadata)
      pendingTempIds.current.delete(tempId)
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === tempId)
        if (idx === -1) return prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]
        const next = [...prev]
        next[idx] = msg
        return next
      })
    } catch {
      pendingTempIds.current.delete(tempId)
      setFailedIds(prev => new Set([...prev, tempId]))
      throw
    }
  }, [conversationId, myId])

  const retryMessage = useCallback(async (tempId: string) => {
    const msg = messages.find(m => m.id === tempId)
    if (!msg) return
    setFailedIds(prev => { const n = new Set(prev); n.delete(tempId); return n })
    setMessages(prev => prev.filter(m => m.id !== tempId))
    try {
      await sendMessage(msg.content, msg.content_type, msg.metadata ?? undefined)
    } catch {}
  }, [messages, sendMessage])

  const sendTyping = useCallback((isTyping: boolean) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', is_typing: isTyping }))
    }
  }, [])

  const sendVoiceTyping = useCallback((isRecording: boolean) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', is_typing: isRecording, mode: 'voice' }))
    }
  }, [])

  const loadMore = useCallback(async (): Promise<boolean> => {
    if (messages.length === 0 || noMoreRef.current) return false
    const oldest = messages[messages.length - 1]
    try {
      const older = await ApiService.getMessages(conversationId, oldest.sent_at)
      if (older.length > 0) {
        setMessages(prev => [...prev, ...older])
        return true
      }
      noMoreRef.current = true
      return false
    } catch {
      return false
    }
  }, [conversationId, messages])

  const reactToMessage = useCallback((msgId: string, emoji: string | null): void => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'reaction', message_id: msgId, emoji }))
    applyReactionUpdate(msgId, myId ?? '', emoji)
  }, [myId, applyReactionUpdate])

  return {
    messages,
    isPartnerTyping,
    isPartnerRecording,
    isPartnerOnline,
    isWsConnected,
    wsError,
    loading,
    partnerSeenAt,
    failedIds,
    sendMessage,
    retryMessage,
    sendTyping,
    sendVoiceTyping,
    loadMore,
    reactToMessage,
  }
}

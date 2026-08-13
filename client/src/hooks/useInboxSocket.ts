import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import ApiService from '@/api/apiService'

export function useInboxSocket(onUpdate: () => void) {
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
          if (data.type === 'conversation_updated') onUpdate()
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
  }, [onUpdate])
}

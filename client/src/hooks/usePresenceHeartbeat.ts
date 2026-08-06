import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import ApiService from '@/api/apiService'
import { useAuthStore } from '@/store/auth'

const HEARTBEAT_INTERVAL_MS = 2 * 60_000

/** Keeps `users.last_seen_at` true to reality: pings the backend while the
 * app is foregrounded and the user is logged in, independent of whether a
 * chat WebSocket happens to be open. This is what "Active 5m ago" elsewhere
 * in the app (host cards, chat rows, profile) is actually reading. */
export function usePresenceHeartbeat() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }

    const send = () => { ApiService.heartbeat().catch(() => {}) }

    const start = () => {
      send()
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(send, HEARTBEAT_INTERVAL_MS)
    }
    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (AppState.currentState === 'active') start()

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') start()
      else stop()
    })

    return () => {
      stop()
      sub.remove()
    }
  }, [isAuthenticated])
}

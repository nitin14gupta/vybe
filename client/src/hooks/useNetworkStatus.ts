import { useEffect, useRef } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useNetworkStore } from '@/store/networkStore'

// Brief drops (elevators, tunnels, wifi handoff) shouldn't flash the banner —
// only surface it once a disconnect has held for this long.
const OFFLINE_DEBOUNCE_MS = 1500

function isOnlineState(state: { isConnected: boolean | null; isInternetReachable: boolean | null }) {
  // isInternetReachable starts as null until NetInfo finishes probing — treat
  // "unknown yet" as online rather than assuming the worst.
  return state.isConnected !== false && state.isInternetReachable !== false
}

// Mount once near the app root — this owns the NetInfo subscription and
// writes to the shared networkStore. Components read connectivity via
// useNetworkStore instead of subscribing to NetInfo themselves.
export function useNetworkStatus() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (timerRef.current) clearTimeout(timerRef.current)

      if (isOnlineState(state)) {
        useNetworkStore.getState().setOnline(true)
      } else {
        timerRef.current = setTimeout(() => {
          useNetworkStore.getState().setOnline(false)
        }, OFFLINE_DEBOUNCE_MS)
      }
    })

    return () => {
      unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}

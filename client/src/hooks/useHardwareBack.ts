import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'

/**
 * Intercepts Android hardware back button using useFocusEffect so the
 * listener is only active while this screen is focused (not during transitions).
 * useEffect doesn't work here — it fires outside Expo Router's nav lifecycle.
 */
export function useHardwareBack() {
  const router = useRouter()

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (router.canGoBack()) {
          router.back()
          return true
        }
        return false
      })
      return () => sub.remove()
    }, [router]),
  )
}

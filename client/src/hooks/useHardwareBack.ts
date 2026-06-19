import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'

export function useHardwareBack(fallback: string = '/(tabs)') {
  const router = useRouter()

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (router.canGoBack()) {
          router.back()
        } else {
          router.replace(fallback as any)
        }
        return true
      })
      return () => sub.remove()
    }, [router, fallback]),
  )
}

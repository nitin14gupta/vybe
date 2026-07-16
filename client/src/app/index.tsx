import { useEffect } from 'react'
import { router } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { SplashScreen as AppSplashScreen } from '@/components/SplashScreen'

export default function Index() {
  const { isAuthenticated, profileComplete, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return

    // Navigate imperatively once hydrated
    if (!isAuthenticated) {
      router.replace('/(auth)/welcome' as any)
    } else if (!profileComplete) {
      router.replace('/(onboarding)')
    } else {
      router.replace('/(tabs)')
    }
  }, [isHydrated, isAuthenticated, profileComplete])

  return (
    <View style={StyleSheet.absoluteFill}>
      <AppSplashScreen />
    </View>
  )
}
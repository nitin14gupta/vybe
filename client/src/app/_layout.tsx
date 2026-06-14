import '../../global.css'
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useVybeFonts } from '@/lib/fonts'
import { useAuthStore } from '@/store/auth'

SplashScreen.preventAutoHideAsync()

function AuthGuard() {
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, profileComplete } = useAuthStore()

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inTabs = segments[0] === '(tabs)'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/')
    } else if (isAuthenticated && !profileComplete && inTabs) {
      router.replace('/(onboarding)/profile')
    } else if (isAuthenticated && profileComplete && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/')
    }
  }, [isAuthenticated, profileComplete, segments])

  return <Slot />
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useVybeFonts()

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <>
      <StatusBar style="light" />
      <AuthGuard />
    </>
  )
}

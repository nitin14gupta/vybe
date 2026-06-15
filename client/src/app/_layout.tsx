import '../../global.css'
import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useVybeFonts } from '@/lib/fonts'
import { useAuthStore } from '@/store/auth'
import { tokenStorage } from '@/lib/tokenStorage'
import ApiService from '@/api/apiService'

SplashScreen.preventAutoHideAsync()

// ── Auth guard — redirects based on auth + onboarding state ──────────────────

function AuthGuard({ ready }: { ready: boolean }) {
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, profileComplete } = useAuthStore()

  useEffect(() => {
    if (!ready) return

    const inAuth       = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inTabs       = segments[0] === '(tabs)'

    if (!isAuthenticated) {
      // Not logged in → welcome screen
      if (!inAuth) router.replace('/(auth)/welcome')
    } else if (!profileComplete) {
      // Logged in but onboarding not done → resume onboarding
      if (!inOnboarding) router.replace('/(onboarding)/profile')
    } else {
      // Fully onboarded → home
      if (!inTabs) router.replace('/(tabs)/')
    }
  }, [isAuthenticated, profileComplete, segments, ready])

  return <Slot />
}

// ── Root layout — bootstraps stored session before rendering ─────────────────

export default function RootLayout() {
  const [fontsLoaded, fontError] = useVybeFonts()
  const [authReady, setAuthReady] = useState(false)
  const { setAuth } = useAuthStore()

  useEffect(() => {
    async function bootstrap() {
      try {
        const stored = await tokenStorage.load()
        if (stored?.refreshToken) {
          // Always refresh on startup — access tokens are short-lived (15 min)
          try {
            const fresh = await ApiService.refreshToken(stored.refreshToken)
            const next = {
              accessToken:     fresh.access_token,
              refreshToken:    fresh.refresh_token,
              userId:          fresh.user_id,
              phone:           stored.phone,
              profileComplete: fresh.profile_complete,
            }
            await tokenStorage.save(next)
            setAuth(next)
          } catch {
            // Refresh token expired (100-day window) → force re-login
            await tokenStorage.clear()
          }
        }
      } catch (e) {
        console.warn('[bootstrap] error:', e)
      }
      setAuthReady(true)
    }
    bootstrap()
  }, [])

  useEffect(() => {
    if ((fontsLoaded || fontError) && authReady) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError, authReady])

  // Hold splash until fonts + auth check are both done
  if ((!fontsLoaded && !fontError) || !authReady) return null

  return (
    <>
      <StatusBar style="light" />
      <AuthGuard ready={authReady} />
    </>
  )
}

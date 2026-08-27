import '../../global.css'
import { useEffect, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { enableScreens, enableFreeze } from 'react-native-screens'

enableScreens(true)
enableFreeze(true)

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SplashScreen as AppSplashScreen } from '@/components/ui/SplashScreen'
import { useVibeFonts } from '@/lib/fonts'
import { useAuthStore } from '@/store/auth'
import { tokenStorage } from '@/lib/tokenStorage'
import ApiService from '@/api/apiService'
import { PillOverlay, PermissionSheetOverlay, AccountLockedOverlay, MaintenanceOverlay, NoInternetBanner } from '@/components/ui'
import { useNotificationSetup } from '@/hooks/useNotificationSetup'
import { useDeepLinkRouter } from '@/hooks/useDeepLinkRouter'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { isAuthenticated, profileComplete } = useAuthStore()

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && !profileComplete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && profileComplete}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(events)" />
        <Stack.Screen name="(chat)" />
        <Stack.Screen name="(settings)" />
        <Stack.Screen name="(profile)" />
      </Stack.Protected>
    </Stack>
  )
}

// ── Root layout — bootstraps stored session before rendering ─────────────────
const BUTTON_NAV_INSET_THRESHOLD = 30

export default function RootLayout() {
  const [fontsLoaded, fontError] = useVibeFonts()
  const [authReady, setAuthReady] = useState(false)
  const [fontsSettled, setFontsSettled] = useState(false)
  const { setAuth } = useAuthStore()
  const insets = useSafeAreaInsets()
  const isButtonNav = Platform.OS === 'android' && insets.bottom > BUTTON_NAV_INSET_THRESHOLD
  const globalBottomReserve = isButtonNav ? insets.bottom : 0
  useNotificationSetup()
  useDeepLinkRouter()
  useNetworkStatus()
  usePresenceHeartbeat()

  useEffect(() => {
    async function bootstrap() {
      try {
        const stored = await tokenStorage.load()
        if (stored?.refreshToken) {
          // Always refresh on startup — access tokens are short-lived (15 min)
          try {
            const fresh = await ApiService.refreshToken(stored.refreshToken)
            const next = {
              accessToken: fresh.access_token,
              refreshToken: fresh.refresh_token,
              userId: fresh.user_id,
              phone: stored.phone,
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
      useAuthStore.getState().setHydrated(true)
      setAuthReady(true)
    }
    bootstrap()
  }, [])

  useEffect(() => {
    if (!fontsLoaded && !fontError) return
    const timer = setTimeout(() => setFontsSettled(true), 150)
    return () => clearTimeout(timer)
  }, [fontsLoaded, fontError])

  const appReady = fontsSettled && authReady

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync()
  }, [appReady])

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <BottomSheetModalProvider>
          <StatusBar style="light" />
          <View style={{ flex: 1, paddingBottom: globalBottomReserve }}>
            <RootNavigator />
          </View>
          <PillOverlay />
          <PermissionSheetOverlay />
          <AccountLockedOverlay />
          <NoInternetBanner />
          <MaintenanceOverlay />
          {!appReady && (
            <View style={StyleSheet.absoluteFill}>
              <AppSplashScreen />
            </View>
          )}
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})

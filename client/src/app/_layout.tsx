import '../../global.css'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SplashScreen as AppSplashScreen } from '@/components/SplashScreen'
import { useVybeFonts } from '@/lib/fonts'
import { useAuthStore } from '@/store/auth'
import { tokenStorage } from '@/lib/tokenStorage'
import ApiService from '@/api/apiService'
import { PillOverlay, PermissionSheetOverlay, AccountLockedOverlay } from '@/components/ui'
import { useNotificationSetup } from '@/hooks/useNotificationSetup'
import { useDeepLinkRouter } from '@/hooks/useDeepLinkRouter'
import { useE2EESetup } from '@/hooks/useE2EESetup'

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
        <Stack.Screen name="(search)" />
        <Stack.Screen name="(settings)" />
        <Stack.Screen name="(profile)" />
      </Stack.Protected>
    </Stack>
  )
}

// ── Root layout — bootstraps stored session before rendering ─────────────────

export default function RootLayout() {
  const [fontsLoaded, fontError] = useVybeFonts()
  const [authReady, setAuthReady] = useState(false)
  const { setAuth } = useAuthStore()
  useNotificationSetup()
  useDeepLinkRouter()
  useE2EESetup()

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

  const appReady = (fontsLoaded || fontError) && authReady

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <BottomSheetModalProvider>
          <StatusBar style="light" />
          <RootNavigator />
          <PillOverlay />
          <PermissionSheetOverlay />
          <AccountLockedOverlay />
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

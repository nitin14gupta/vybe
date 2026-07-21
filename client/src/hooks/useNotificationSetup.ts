import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notificationStore'
import ApiService from '@/api/apiService'
import { EAS_PROJECT_ID } from '@/api/config'
import { pushDataToTarget } from '@/lib/deepLink'
import { navigateToTarget } from '@/hooks/useDeepLinkRouter'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function useNotificationSetup() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const permission = useNotificationStore(s => s.permission)
  const setPermission = useNotificationStore(s => s.setPermission)
  const registeredToken = useNotificationStore(s => s.registeredToken)
  const setRegisteredToken = useNotificationStore(s => s.setRegisteredToken)
  const listenerRef = useRef<Notifications.EventSubscription | null>(null)
  const handledColdStart = useRef(false)

  // Request permission once the user is authenticated — never before
  useEffect(() => {
    if (!isAuthenticated || permission !== 'undecided') return
    ;(async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('vybe-default', {
          name: 'Gorave notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        })
      }
      const { status: existing } = await Notifications.getPermissionsAsync()
      const finalStatus =
        existing === 'granted'
          ? 'granted'
          : (await Notifications.requestPermissionsAsync()).status
      setPermission(finalStatus === 'granted' ? 'granted' : 'denied')
    })()
  }, [isAuthenticated, permission])

  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted') return

    Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
      .then(async ({ data: freshToken }) => {
        // If token changed, remove the stale one first (prevents duplicate pushes)
        if (registeredToken && registeredToken !== freshToken) {
          await ApiService.removeDeviceToken(registeredToken).catch(() => {})
        }
        // Always register — server uses ON CONFLICT DO NOTHING so this is safe
        await ApiService.registerDeviceToken(freshToken, Platform.OS)
        setRegisteredToken(freshToken)
      })
      .catch(err => {
        // Swallowed before with no trace — surface it so a missing FCM/APNs
        // config (e.g. no google-services.json on Android) is diagnosable.
        console.warn('[push] failed to get/register Expo push token:', err)
      })

    // Cold start — app was launched by tapping a notification. The listener
    // below only fires for taps that happen while it's alive, which a launch
    // from a killed state isn't guaranteed to hit — so check for it separately,
    // once per session.
    if (!handledColdStart.current) {
      handledColdStart.current = true
      Notifications.getLastNotificationResponseAsync().then(res => {
        if (!res) return
        const target = pushDataToTarget(res.notification.request.content.data)
        if (target) navigateToTarget(target)
      })
    }

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(res => {
      const target = pushDataToTarget(res.notification.request.content.data)
      if (target) navigateToTarget(target)
    })

    return () => listenerRef.current?.remove()
  }, [isAuthenticated, permission])
}

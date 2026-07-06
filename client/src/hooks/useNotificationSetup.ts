import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notificationStore'
import ApiService from '@/api/apiService'

const PROJECT_ID = 'da4e0090-c985-42e9-ab31-f6832bcc46e9'

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

  // Request permission once the user is authenticated — never before
  useEffect(() => {
    if (!isAuthenticated || permission !== 'undecided') return
    ;(async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('vybe-default', {
          name: 'Vybe notifications',
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

    Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
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

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(res => {
      const d = res.notification.request.content.data as any
      if (!d?.type) return
      switch (d.type) {
        case 'conversation':
          if (d.conv_id) router.push(`/(chat)/${d.conv_id}` as any)
          break
        case 'profile':
          if (d.user_id) router.push(`/(profile)/${d.user_id}` as any)
          break
        case 'event':
          if (d.event_id) router.push(`/(events)/${d.event_id}` as any)
          break
        case 'vybe':
          router.push('/(tabs)/chat' as any)
          break
      }
    })

    return () => listenerRef.current?.remove()
  }, [isAuthenticated, permission])
}

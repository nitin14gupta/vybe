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
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function useNotificationSetup() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const permission = useNotificationStore(s => s.permission)
  const registeredToken = useNotificationStore(s => s.registeredToken)
  const setRegisteredToken = useNotificationStore(s => s.setRegisteredToken)
  const listenerRef = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted') return

    // Always get token fresh from the OS — tokens can change after reinstall.
    // Compare with the last token we registered; only hit the server if different.
    Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
      .then(async ({ data: freshToken }) => {
        if (freshToken === registeredToken) return
        // Token changed (or first run) — register the new one then drop the old one
        await ApiService.registerDeviceToken(freshToken, Platform.OS)
        if (registeredToken) {
          // Delete the old token so this device doesn't receive duplicate pushes
          await ApiService.removeDeviceToken(registeredToken).catch(() => {})
        }
        setRegisteredToken(freshToken)
      })
      .catch(() => {})

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

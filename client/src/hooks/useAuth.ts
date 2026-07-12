import * as Notifications from 'expo-notifications'
import { useAuthStore } from '@/store/auth'
import { useOnboardingStore } from '@/store/onboarding'
import { tokenStorage } from '@/lib/tokenStorage'
import { sendOTP, verifyOTP, logout as apiLogout } from '@/api/auth'
import ApiService from '@/api/apiService'
import { EAS_PROJECT_ID } from '@/api/config'
import { useNotificationStore } from '@/store/notificationStore'

export function useAuth() {
  const store = useAuthStore()

  const handleSendOTP = async (phone: string) => {
    await sendOTP(phone)
  }

  const handleVerifyOTP = async (phone: string, code: string) => {
    const tokens = await verifyOTP(phone, code)
    store.setAuth({
      userId: tokens.user_id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      phone,
      profileComplete: tokens.profile_complete,
    })
    await tokenStorage.save({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      userId: tokens.user_id,
      phone,
      profileComplete: tokens.profile_complete,
    })
    return tokens
  }

  const handleLogout = async () => {
    // Remove device token from server so this device stops receiving pushes
    if (useNotificationStore.getState().permission === 'granted') {
      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: EAS_PROJECT_ID,
        })
        await ApiService.removeDeviceToken(token)
      } catch {}
    }
    if (store.refreshToken) {
      try {
        await apiLogout(store.refreshToken)
      } catch {}
    }
    store.clearAuth()
    useOnboardingStore.getState().reset()
    // Clear stored token so next login re-registers fresh
    useNotificationStore.getState().setRegisteredToken(null)
  }

  return {
    handleSendOTP,
    handleVerifyOTP,
    handleLogout,
    ...store,
  }
}

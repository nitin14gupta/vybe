import { useAuthStore } from '@/store/auth'
import { tokenStorage } from '@/lib/tokenStorage'
import { sendOTP, verifyOTP, logout as apiLogout } from '@/api/auth'

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
    if (store.refreshToken) {
      try {
        await apiLogout(store.refreshToken)
      } catch {}
    }
    store.clearAuth()
  }

  return {
    handleSendOTP,
    handleVerifyOTP,
    handleLogout,
    ...store,
  }
}

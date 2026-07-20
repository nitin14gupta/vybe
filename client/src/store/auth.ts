import { create } from 'zustand'
import { tokenStorage } from '@/lib/tokenStorage'
import { useDeepLinkStore } from '@/store/deepLinkStore'
import { clearAllCached } from '@/lib/queryCache'

interface AuthState {
  isAuthenticated: boolean
  isHydrated: boolean
  userId: string | null
  accessToken: string | null
  refreshToken: string | null
  phone: string | null
  profileComplete: boolean
  dob: string | null
  setHydrated: (val: boolean) => void
  setAuth: (payload: {
    userId: string
    accessToken: string
    refreshToken: string
    phone: string
    profileComplete: boolean
  }) => void
  setProfileComplete: (val: boolean) => void
  setDob: (dob: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isHydrated: false,
  userId: null,
  accessToken: null,
  refreshToken: null,
  phone: null,
  profileComplete: false,
  dob: null,

  setHydrated: (val) => set({ isHydrated: val }),

  setAuth: (payload) => {
    set({
      isAuthenticated: true,
      userId: payload.userId,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      phone: payload.phone,
      profileComplete: payload.profileComplete,
    })
  },

  setProfileComplete: (val) => {
    set({ profileComplete: val })
    tokenStorage.updateProfileComplete(val)
  },

  setDob: (dob) => set({ dob }),

  clearAuth: () => {
    set({
      isAuthenticated: false,
      userId: null,
      accessToken: null,
      refreshToken: null,
      phone: null,
      profileComplete: false,
      dob: null,
    })
    tokenStorage.clear()
    clearAllCached()
    // Drop any deep link that was queued for a now-abandoned session so it
    // doesn't silently resurface on the next unrelated login.
    useDeepLinkStore.getState().clearPending()
  },
}))

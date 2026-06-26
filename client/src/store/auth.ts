import { create } from 'zustand'
import { tokenStorage } from '@/lib/tokenStorage'

interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  accessToken: string | null
  refreshToken: string | null
  phone: string | null
  profileComplete: boolean
  dob: string | null
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
  userId: null,
  accessToken: null,
  refreshToken: null,
  phone: null,
  profileComplete: false,
  dob: null,

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
  },
}))

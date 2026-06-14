import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  accessToken: string | null
  refreshToken: string | null
  phone: string | null
  profileComplete: boolean
  setAuth: (payload: {
    userId: string
    accessToken: string
    refreshToken: string
    phone: string
    profileComplete: boolean
  }) => void
  setProfileComplete: (val: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  accessToken: null,
  refreshToken: null,
  phone: null,
  profileComplete: false,

  setAuth: (payload) =>
    set({
      isAuthenticated: true,
      userId: payload.userId,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      phone: payload.phone,
      profileComplete: payload.profileComplete,
    }),

  setProfileComplete: (val) => set({ profileComplete: val }),

  clearAuth: () =>
    set({
      isAuthenticated: false,
      userId: null,
      accessToken: null,
      refreshToken: null,
      phone: null,
      profileComplete: false,
    }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '@/types/admin'

interface AuthState {
  isAuthenticated: boolean
  admin: AdminUser | null
  accessToken: string | null
  refreshToken: string | null
  hasHydrated: boolean
  setAuth: (args: { admin: AdminUser; accessToken: string; refreshToken: string }) => void
  setAccessToken: (accessToken: string) => void
  clearAuth: () => void
  setHasHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      admin: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setAuth: ({ admin, accessToken, refreshToken }) =>
        set({ isAuthenticated: true, admin, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () =>
        set({ isAuthenticated: false, admin: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'gorave-admin-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        admin: s.admin,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    },
  ),
)

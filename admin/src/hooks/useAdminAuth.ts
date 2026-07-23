'use client'

import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import type { AdminTokenResponse } from '@/types/admin'

export function useAdminAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const admin = useAuthStore((s) => s.admin)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  const login = async (email: string, password: string) => {
    const data = await apiClient.post<AdminTokenResponse>('/admin/auth/login', { email, password })
    setAuth({
      admin: { adminId: data.admin_id, email: data.email, name: data.name, role: data.role },
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    })
  }

  const logout = async () => {
    if (refreshToken) {
      try {
        await apiClient.post('/admin/auth/logout', { refresh_token: refreshToken })
      } catch {
        // best-effort — clear local state regardless
      }
    }
    clearAuth()
  }

  return { isAuthenticated, admin, login, logout }
}

import { API_BASE_URL } from './constants'
import { useAuthStore } from '@/store/authStore'
import type { AdminTokenResponse } from '@/types/admin'

let _refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<string> {
  const store = useAuthStore.getState()
  if (!store.refreshToken) {
    store.clearAuth()
    throw new Error('Session expired. Please sign in again.')
  }

  if (!_refreshPromise) {
    _refreshPromise = (async () => {
      const res = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: store.refreshToken }),
      })
      if (!res.ok) throw new Error('refresh failed')
      const data: AdminTokenResponse = await res.json()
      useAuthStore.getState().setAuth({
        admin: { adminId: data.admin_id, email: data.email, name: data.name, role: data.role },
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      })
    })().finally(() => {
      _refreshPromise = null
    })
  }

  try {
    await _refreshPromise
  } catch {
    useAuthStore.getState().clearAuth()
    throw new Error('Session expired. Please sign in again.')
  }
  return useAuthStore.getState().accessToken!
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const err = await response.json()
    if (Array.isArray(err.detail)) {
      return err.detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(', ')
    }
    if (err.detail && typeof err.detail === 'object') {
      return err.detail.reason ?? err.detail.code ?? JSON.stringify(err.detail)
    }
    return String(err.detail ?? err.message ?? `Request failed (${response.status})`)
  } catch {
    return `Request failed (${response.status})`
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (res.status === 401 && !isRetry && useAuthStore.getState().refreshToken) {
    await refreshAccessToken()
    return request<T>(path, init, true)
  }

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw Object.assign(new Error(detail), { status: res.status })
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

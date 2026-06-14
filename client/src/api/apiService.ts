import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS, createAuthHeader } from './config'
import { useAuthStore } from '@/store/auth'

// ── Response shapes ──────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token: string
  user_id: string
  profile_complete: boolean
}

export interface UserResponse {
  id: string
  phone: string
  name: string | null
  dob: string | null
  gender: string | null
  city: string | null
  lat: number | null
  lng: number | null
  voice_url: string | null
  interests: string[]
  profile_complete: boolean
  photos: PhotoResponse[]
}

export interface PhotoResponse {
  id: string
  url: string
  position: number
}

// ── ApiService ───────────────────────────────────────────────────────────────

class ApiService {
  // ── Private helpers ────────────────────────────────────────────────────────

  private static createHeaders(token?: string | null) {
    return {
      ...DEFAULT_HEADERS,
      ...(token ? createAuthHeader(token) : {}),
    }
  }

  private static async handleResponse<T>(
    response: Response,
    endpoint: string,
    retryFn?: () => Promise<T>,
  ): Promise<T> {
    if (response.status === 401 && retryFn) {
      const { refreshToken: storedRefresh, setAuth, clearAuth, phone, profileComplete } =
        useAuthStore.getState()

      if (storedRefresh) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ refresh_token: storedRefresh }),
          })
          if (!refreshRes.ok) throw new Error('refresh failed')
          const tokens: TokenResponse = await refreshRes.json()
          setAuth({
            userId: tokens.user_id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            phone: phone ?? '',
            profileComplete: tokens.profile_complete,
          })
          return retryFn()
        } catch {
          clearAuth()
          throw new Error('Session expired. Please sign in again.')
        }
      }

      clearAuth()
      throw new Error('Session expired. Please sign in again.')
    }

    if (!response.ok) {
      let detail = `Request failed (${response.status})`
      try {
        const err = await response.json()
        detail = err.detail ?? err.message ?? detail
      } catch {}
      throw Object.assign(new Error(detail), { status: response.status })
    }

    return response.json() as Promise<T>
  }

  // ── Core HTTP verbs ────────────────────────────────────────────────────────

  static async get<T>(endpoint: string, token?: string | null): Promise<T> {
    const call = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async post<T>(endpoint: string, body: unknown, token?: string | null): Promise<T> {
    const call = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
        body: JSON.stringify(body),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async patch<T>(endpoint: string, body: unknown, token?: string | null): Promise<T> {
    const call = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
        body: JSON.stringify(body),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async put<T>(endpoint: string, body: unknown, token?: string | null): Promise<T> {
    const call = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
        body: JSON.stringify(body),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async delete<T>(endpoint: string, token?: string | null): Promise<T> {
    const call = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async postFormData<T>(endpoint: string, formData: FormData, token?: string | null): Promise<T> {
    const resolvedToken = useAuthStore.getState().accessToken ?? token
    const call = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: resolvedToken ? createAuthHeader(resolvedToken) : {},
        body: formData,
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  static async sendOTP(phone: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(ENDPOINTS.SEND_OTP, { phone })
  }

  static async verifyOTP(phone: string, code: string): Promise<TokenResponse> {
    return this.post<TokenResponse>(ENDPOINTS.VERIFY_OTP, { phone, code })
  }

  static async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    return this.handleResponse<TokenResponse>(response, ENDPOINTS.REFRESH_TOKEN)
  }

  static async logout(refreshToken: string): Promise<void> {
    await this.post<void>(ENDPOINTS.LOGOUT, { refresh_token: refreshToken })
  }

  // ── User profile ───────────────────────────────────────────────────────────

  static async createProfile(data: {
    name: string
    dob: string
    gender: string
  }): Promise<UserResponse> {
    return this.post<UserResponse>(ENDPOINTS.CREATE_PROFILE, data)
  }

  static async updateProfile(data: {
    name?: string
    dob?: string
    gender?: string
  }): Promise<UserResponse> {
    return this.patch<UserResponse>(ENDPOINTS.UPDATE_PROFILE, data)
  }

  static async setInterests(interests: string[]): Promise<{ message: string }> {
    return this.post<{ message: string }>(ENDPOINTS.SET_INTERESTS, { interests })
  }

  static async setLocation(
    city: string,
    lat: number,
    lng: number,
  ): Promise<{ message: string }> {
    return this.post<{ message: string }>(ENDPOINTS.SET_LOCATION, { city, lat, lng })
  }

  static async getMe(): Promise<UserResponse> {
    return this.get<UserResponse>(ENDPOINTS.GET_ME)
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  static async uploadPhoto(uri: string, position: number): Promise<string> {
    const formData = new FormData()
    const filename = uri.split('/').pop() ?? 'photo.jpg'
    const ext = filename.split('.').pop()?.toLowerCase()
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
    formData.append('file', { uri, name: filename, type: mime } as any)
    formData.append('position', String(position))

    const response = await this.postFormData<{ url: string }>(ENDPOINTS.UPLOAD_PHOTO, formData)
    return response.url
  }

  static async deletePhoto(photoId: string): Promise<void> {
    const endpoint = ENDPOINTS.DELETE_PHOTO.replace('{id}', photoId)
    return this.delete<void>(endpoint)
  }

  static async uploadVoice(uri: string): Promise<string> {
    const formData = new FormData()
    const filename = uri.split('/').pop() ?? 'voice.m4a'
    formData.append('file', { uri, name: filename, type: 'audio/m4a' } as any)

    const response = await this.postFormData<{ url: string }>(ENDPOINTS.UPLOAD_VOICE, formData)
    return response.url
  }
}

export default ApiService

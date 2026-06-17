import * as FileSystem from 'expo-file-system/legacy'
import { API_BASE_URL, WS_BASE_URL, ENDPOINTS, DEFAULT_HEADERS, createAuthHeader } from './config'
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
  bio: string | null
  city: string | null
  lat: number | null
  lng: number | null
  voice_url: string | null
  interests: string[]
  badges: string[]
  profile_complete: boolean
  photos: PhotoResponse[]
}

export interface InterestResponse {
  name: string
  emoji: string
}

export type BadgeResponse = string

export interface PhotoResponse {
  id: string
  url: string
  position: number
}

export interface CityResponse {
  name: string
  state: string
}

export interface ProfileResponse extends UserResponse {
  vibers_count: number
  vibing_count: number
  is_following?: boolean
}

export interface EventPhoto {
  url: string
  position: number
}

export interface EventSummary {
  id: string
  title: string
  event_type: string
  date_time: string
  end_time: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  price_inr: number
  is_free: boolean
  spots_left: number
  capacity: number
  distance_km: number | null
  cover_photos: EventPhoto[]
  host_name: string | null
  host_avatar: string | null
  age_restriction: number
  attendee_count: number
}

export interface EventDetail extends EventSummary {
  description: string | null
  rules: string | null
  host_id: string
  is_cancelled: boolean
  cancel_deadline: string
  edit_deadline: string
}

export interface CreateEventPayload {
  title: string
  event_type: string
  description?: string
  rules?: string
  date_time: string
  end_time?: string
  capacity: number
  age_restriction: number
  location_name?: string
  location_lat?: number
  location_lng?: number
  price_inr: number
  cover_photos?: string[]
}

export interface DiscoverUser {
  id: string
  name: string | null
  age: number | null
  gender: string | null
  bio: string | null
  city: string | null
  interests: string[]
  voice_url: string | null
  distance_km: number | null
  match_pct: number
  photos: PhotoResponse[]
}

export interface VybeRequest {
  id: string
  sender_id: string
  name: string | null
  city: string | null
  message: string
  status: string
  created_at: string
  photos: PhotoResponse[]
}

export interface Conversation {
  id: string
  status: 'pending' | 'active'
  partner_id: string
  partner_name: string | null
  partner_avatar: string | null
  last_message: string | null
  last_message_type: string | null
  last_sender_id: string | null
  last_sent_at: string | null
  unread_count: number
  last_message_at: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  content_type: 'text' | 'event' | 'profile' | 'image'
  metadata: Record<string, any> | null
  sent_at: string
  read_at: string | null
}

export interface BlockedUser {
  id: string
  name: string | null
  city: string | null
  avatar: string | null
  created_at: string
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
        // Pydantic v2 returns detail as an array on validation errors
        if (Array.isArray(err.detail)) {
          detail = err.detail.map((d: any) => d.msg ?? String(d)).join(', ')
        } else {
          detail = String(err.detail ?? err.message ?? detail)
        }
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
    bio?: string
    badges?: string[]
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

  static async getMe(): Promise<ProfileResponse> {
    return this.get<ProfileResponse>(ENDPOINTS.GET_ME)
  }

  static async getProfile(userId: string): Promise<ProfileResponse> {
    const endpoint = ENDPOINTS.GET_PROFILE.replace(':id', userId)
    return this.get<ProfileResponse>(endpoint)
  }

  static async followUser(userId: string): Promise<void> {
    const endpoint = ENDPOINTS.FOLLOW_USER.replace(':id', userId)
    await this.post<{ ok: boolean }>(endpoint, {})
  }

  static async unfollowUser(userId: string): Promise<void> {
    const endpoint = ENDPOINTS.FOLLOW_USER.replace(':id', userId)
    await this.delete<{ ok: boolean }>(endpoint)
  }

  static async getCities(): Promise<CityResponse[]> {
    const res = await this.get<{ cities: CityResponse[] }>(ENDPOINTS.GET_CITIES)
    return res.cities
  }

  static async getInterests(): Promise<InterestResponse[]> {
    const res = await this.get<{ interests: InterestResponse[] }>(ENDPOINTS.GET_INTERESTS)
    return res.interests
  }

  static async getBadges(): Promise<string[]> {
    const res = await this.get<{ badges: string[] }>(ENDPOINTS.GET_BADGES)
    return res.badges
  }

  static async getDiscover(
    limit = 30,
    filters: { gender?: string; minAge?: number; maxAge?: number; maxDistanceKm?: number } = {},
  ): Promise<DiscoverUser[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.minAge != null) params.set('min_age', String(filters.minAge))
    if (filters.maxAge != null) params.set('max_age', String(filters.maxAge))
    if (filters.maxDistanceKm != null) params.set('max_distance_km', String(filters.maxDistanceKm))
    return this.get<DiscoverUser[]>(`${ENDPOINTS.DISCOVER}?${params.toString()}`)
  }

  static async passUser(targetId: string): Promise<void> {
    await this.post<{ ok: boolean }>(ENDPOINTS.DISCOVER_PASS, { target_id: targetId })
  }

  static async sendVibe(targetId: string, message: string): Promise<{ conversation_id: string | null }> {
    return this.post<{ ok: boolean; conversation_id: string | null }>(ENDPOINTS.VIBES, { target_id: targetId, message })
  }

  static async respondToVibe(vibeId: string, action: 'accept' | 'pass', icebreaker?: string): Promise<{ status: string; conversation_id?: string }> {
    return this.patch<{ ok: boolean; status: string; conversation_id?: string }>(
      `${ENDPOINTS.VIBES}/${vibeId}`,
      { action, icebreaker },
    )
  }

  static async getReceivedVibes(): Promise<VybeRequest[]> {
    return this.get<VybeRequest[]>(ENDPOINTS.VIBES_RECEIVED)
  }

  // ── Chat ───────────────────────────────────────────────────────────────────

  static async getConversations(): Promise<{ pending: Conversation[]; active: Conversation[]; locked: Conversation[] }> {
    return this.get(ENDPOINTS.CONVERSATIONS)
  }

  static async getMessages(convId: string, before?: string): Promise<Message[]> {
    const endpoint = ENDPOINTS.CONVERSATION_MESSAGES.replace(':id', convId)
    const qs = before ? `?before=${encodeURIComponent(before)}` : ''
    return this.get<Message[]>(`${endpoint}${qs}`)
  }

  static async sendMessage(convId: string, content: string, contentType = 'text', metadata?: object): Promise<Message> {
    const endpoint = ENDPOINTS.CONVERSATION_MESSAGES.replace(':id', convId)
    return this.post<Message>(endpoint, { content, content_type: contentType, metadata })
  }

  static async markRead(convId: string): Promise<void> {
    const endpoint = ENDPOINTS.CONVERSATION_READ.replace(':id', convId)
    await this.patch<{ ok: boolean }>(endpoint, {})
  }

  static getChatWsUrl(convId: string, accessToken: string): string {
    return `${WS_BASE_URL}/ws/chat/${convId}?token=${accessToken}`
  }

  // ── Block / Report ─────────────────────────────────────────────────────────

  static async blockUser(userId: string): Promise<void> {
    const endpoint = ENDPOINTS.BLOCK_USER.replace(':id', userId)
    await this.post<{ ok: boolean }>(endpoint, {})
  }

  static async unblockUser(userId: string): Promise<void> {
    const endpoint = ENDPOINTS.BLOCK_USER.replace(':id', userId)
    await this.delete<{ ok: boolean }>(endpoint)
  }

  static async getBlockedUsers(): Promise<BlockedUser[]> {
    return this.get<BlockedUser[]>(ENDPOINTS.BLOCKED_LIST)
  }

  static async reportUser(userId: string, reason: string): Promise<void> {
    const endpoint = ENDPOINTS.REPORT_USER.replace(':id', userId)
    await this.post<{ ok: boolean }>(endpoint, { reason })
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  static async getEvents(filters: {
    lat?: number
    lng?: number
    radius_km?: number
    category?: string
    is_free?: boolean
    date_range?: string
    min_lat?: number
    max_lat?: number
    min_lng?: number
    max_lng?: number
  } = {}): Promise<EventSummary[]> {
    const params = new URLSearchParams()
    if (filters.lat != null) params.set('lat', String(filters.lat))
    if (filters.lng != null) params.set('lng', String(filters.lng))
    if (filters.radius_km != null) params.set('radius_km', String(filters.radius_km))
    if (filters.category) params.set('category', filters.category)
    if (filters.is_free != null) params.set('is_free', String(filters.is_free))
    if (filters.date_range) params.set('date_range', filters.date_range)
    if (filters.min_lat != null) params.set('min_lat', String(filters.min_lat))
    if (filters.max_lat != null) params.set('max_lat', String(filters.max_lat))
    if (filters.min_lng != null) params.set('min_lng', String(filters.min_lng))
    if (filters.max_lng != null) params.set('max_lng', String(filters.max_lng))
    const qs = params.toString()
    return this.get<EventSummary[]>(`${ENDPOINTS.EVENTS}${qs ? '?' + qs : ''}`)
  }

  static async getEvent(id: string): Promise<EventDetail> {
    return this.get<EventDetail>(ENDPOINTS.EVENT_DETAIL.replace(':id', id))
  }

  static async createEvent(data: CreateEventPayload): Promise<EventDetail> {
    return this.post<EventDetail>(ENDPOINTS.EVENTS, data)
  }

  static async updateEvent(id: string, data: Partial<CreateEventPayload>): Promise<EventDetail> {
    return this.patch<EventDetail>(ENDPOINTS.EVENT_UPDATE.replace(':id', id), data)
  }

  static async rsvpEvent(id: string, action: 'going' | 'cancel'): Promise<{ status: string }> {
    return this.post<{ status: string }>(ENDPOINTS.EVENT_RSVP.replace(':id', id), { action })
  }

  static async cancelEvent(id: string): Promise<void> {
    await this.delete<{ ok: boolean }>(ENDPOINTS.EVENT_DETAIL.replace(':id', id))
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  static uploadPhoto(uri: string, position: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().accessToken
      const filename = uri.split('/').pop() ?? 'photo.jpg'
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg'

      const formData = new FormData()
      formData.append('file', { uri, name: filename, type: mime } as any)
      formData.append('position', String(position))

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE_URL}${ENDPOINTS.UPLOAD_PHOTO}`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.timeout = 30000

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText).url)
          } catch {
            reject(new Error('Invalid server response'))
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(Object.assign(new Error(err.detail ?? `Upload failed (${xhr.status})`), { status: xhr.status }))
          } catch {
            reject(Object.assign(new Error(`Upload failed (${xhr.status})`), { status: xhr.status }))
          }
        }
      }
      xhr.onerror = () => reject(new Error('Network error — check server is reachable'))
      xhr.ontimeout = () => reject(new Error('Upload timed out'))
      xhr.send(formData)
    })
  }

  static uploadEventPhoto(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().accessToken
      const filename = uri.split('/').pop() ?? 'photo.jpg'
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg'

      const formData = new FormData()
      formData.append('file', { uri, name: filename, type: mime } as any)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE_URL}${ENDPOINTS.UPLOAD_EVENT_PHOTO}`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.timeout = 30000

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText).url) }
          catch { reject(new Error('Invalid server response')) }
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.detail ?? `Upload failed (${xhr.status})`))
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`))
          }
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.ontimeout = () => reject(new Error('Upload timed out'))
      xhr.send(formData)
    })
  }

  static async swapPhotos(positionA: number, positionB: number): Promise<void> {
    await this.post<{ ok: boolean }>(ENDPOINTS.SWAP_PHOTOS, {
      position_a: positionA,
      position_b: positionB,
    })
  }

  static async deletePhoto(photoId: string): Promise<void> {
    const endpoint = ENDPOINTS.DELETE_PHOTO.replace('{id}', photoId)
    return this.delete<void>(endpoint)
  }

  static async uploadVoice(uri: string): Promise<string> {
    const token = useAuthStore.getState().accessToken
    const ext = (uri.split('/').pop() ?? 'voice.m4a').split('.').pop()?.toLowerCase() ?? 'm4a'
    const mime = ext === 'mp4' ? 'audio/mp4' : ext === '3gp' ? 'audio/3gpp' : 'audio/m4a'

    const result = await FileSystem.uploadAsync(
      `${API_BASE_URL}${ENDPOINTS.UPLOAD_VOICE}`,
      uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: mime,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    )

    if (result.status < 200 || result.status >= 300) {
      let detail = `Upload failed (${result.status})`
      try { detail = JSON.parse(result.body)?.detail ?? detail } catch {}
      throw new Error(detail)
    }

    try {
      return JSON.parse(result.body).url
    } catch {
      throw new Error('Invalid server response')
    }
  }
}

export default ApiService

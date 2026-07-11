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
  username: string | null
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
  name_changed_at: string | null
  discoverable: boolean
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
  is_blocked_by_me?: boolean
  is_blocked_by_them?: boolean
  is_deleted?: boolean
}

export interface ExtendedProfile extends ProfileResponse {
  mutual_count: number
  vybe_status: 'none' | 'pending' | 'connected'
  vybe_id: string | null
  vybe_sent_by_me: boolean
  conversation_id: string | null
  events_attending: EventSummary[]
}

export interface FollowUser {
  id: string
  name: string | null
  username: string | null
  city: string | null
  avatar_url: string | null
  is_following: boolean
  follows_back: boolean
  is_me: boolean
}

export interface FollowsPage {
  users: FollowUser[]
  total: number
  has_more: boolean
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
  host_is_deleted?: boolean
  age_restriction: number
  attendee_count: number
  is_cancelled?: boolean
  waitlist_count: number
  is_waitlist_full: boolean
  // Relationship/relevance signals — only populated by a search-ranked
  // getEvents(q) call; false everywhere else.
  is_following_host?: boolean
  attended_host_before?: boolean
  paid_attended_host_before?: boolean
}

export interface EventDetail extends EventSummary {
  description: string | null
  rules: string | null
  host_id: string
  is_cancelled: boolean
  cancel_deadline: string
  edit_deadline: string
  my_ticket_token: string | null
  my_checked_in_at: string | null
  avg_rating: number | null
  my_rsvp_status: 'going' | 'waitlist' | 'cancelled' | null
  my_waitlist_position: number | null
  my_offer_expires_at: string | null
  my_review_rating: number | null
}

export interface WaitlistEntry {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  joined_at: string
  offer_expires_at: string | null
  position: number
}

export interface TicketInfo {
  ticket_token: string
  event_title: string
  date_time: string
  end_time: string | null
  location_name: string | null
  event_type: string
  host_name: string | null
}

export interface ReviewItem {
  id: string
  reviewer_name: string | null
  reviewer_avatar: string | null
  rating: number
  body: string | null
  created_at: string
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
  username: string | null
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
  username: string | null
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
  partner_username: string | null
  partner_avatar: string | null
  partner_is_deleted: boolean
  partner_public_key: string | null
  last_message: string | null
  last_message_type: string | null
  last_sender_id: string | null
  last_sent_at: string | null
  last_unsent?: boolean
  unread_count: number
  last_message_at: string | null
}

export interface EventAttendee {
  id: string
  name: string | null
  username: string | null
  city: string | null
  avatar: string | null
  status: string
  joined_at: string
  checked_in_at: string | null
  ticket_token: string | null
}

export interface EventGuest {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  is_following: boolean
}

export interface LinkPreview {
  url: string
  hostname: string | null
  title: string | null
  description: string | null
  image: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  content_type: 'text' | 'event' | 'profile' | 'image' | 'voice' | 'video' | 'gif'
  metadata: Record<string, any> | null
  sent_at: string
  read_at: string | null
  reactions: Record<string, string> | null
  unsent_at?: string | null
  edited_at?: string | null
}

export interface WalletTransaction {
  id: string
  amount_inr: number
  type: 'credit' | 'debit'
  source: 'event_refund' | 'ticket_purchase'
  description: string | null
  expires_at: string | null
  created_at: string
}

export interface PaymentOrderResponse {
  full_wallet: boolean
  order_id?: string
  razorpay_key?: string
  amount?: number
  total: number
  ticket_price: number
  platform_fee: number
  wallet_amount: number
  event_title?: string
  contact?: string   // user's phone e.g. "+919876543210"
  email?: string     // synthetic pay_<uid>@vybe.in
}

export interface BlockedUser {
  id: string
  name: string | null
  city: string | null
  avatar: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  type: string
  actor_id: string | null
  actor_name: string | null
  actor_avatar: string | null
  entity_id: string | null
  entity_type: string | null
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

// ── ApiService ───────────────────────────────────────────────────────────────

// Mutex: only one token refresh in-flight at a time — concurrent 401s share the same promise
let _refreshPromise: Promise<void> | null = null

class ApiService {
  // ── Private helpers ────────────────────────────────────────────────────────

  private static createHeaders(token?: string | null) {
    return {
      ...DEFAULT_HEADERS,
      ...(token ? createAuthHeader(token) : {}),
    }
  }

  private static fetchWithTimeout(url: string, opts: RequestInit, ms = 10000): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer))
  }

  // Shared mutex — concurrent 401s (e.g. a batch of media uploads firing at once)
  // share the same in-flight refresh instead of each racing their own.
  private static async refreshAccessToken(): Promise<string | null> {
    const store = useAuthStore.getState()
    if (!store.refreshToken) {
      store.clearAuth()
      throw new Error('Session expired. Please sign in again.')
    }

    if (!_refreshPromise) {
      _refreshPromise = (async () => {
        const refreshRes = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({ refresh_token: store.refreshToken }),
        })
        if (!refreshRes.ok) throw new Error('refresh failed')
        const tokens: TokenResponse = await refreshRes.json()
        useAuthStore.getState().setAuth({
          userId: tokens.user_id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          phone: store.phone ?? '',
          profileComplete: tokens.profile_complete,
        })
      })().finally(() => { _refreshPromise = null })
    }

    try {
      await _refreshPromise
    } catch {
      useAuthStore.getState().clearAuth()
      throw new Error('Session expired. Please sign in again.')
    }
    return useAuthStore.getState().accessToken
  }

  // uploadAsync (expo-file-system) result shape, reused for the retry-on-401 wrapper
  private static async fsUpload(
    url: string, uri: string, mime: string, token: string | null, parameters?: Record<string, string>
  ): Promise<{ status: number; body: string }> {
    const result = await FileSystem.uploadAsync(url, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: mime,
      parameters,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return { status: result.status, body: result.body }
  }

  private static async handleResponse<T>(
    response: Response,
    endpoint: string,
    retryFn?: () => Promise<T>,
  ): Promise<T> {
    if (response.status === 401 && retryFn) {
      await this.refreshAccessToken()
      return retryFn()
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
      } catch { }
      throw Object.assign(new Error(detail), { status: response.status })
    }

    return response.json() as Promise<T>
  }

  // ── Core HTTP verbs ────────────────────────────────────────────────────────

  static async get<T>(endpoint: string, token?: string | null): Promise<T> {
    const call = () =>
      this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async post<T>(endpoint: string, body: unknown, token?: string | null): Promise<T> {
    const call = () =>
      this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
        body: JSON.stringify(body),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async patch<T>(endpoint: string, body: unknown, token?: string | null): Promise<T> {
    const call = () =>
      this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
        body: JSON.stringify(body),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async put<T>(endpoint: string, body: unknown, token?: string | null): Promise<T> {
    const call = () =>
      this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
        body: JSON.stringify(body),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async delete<T>(endpoint: string, token?: string | null): Promise<T> {
    const call = () =>
      this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.createHeaders(useAuthStore.getState().accessToken ?? token),
      }).then(res => this.handleResponse<T>(res, endpoint, call))
    return call()
  }

  static async postFormData<T>(endpoint: string, formData: FormData, token?: string | null): Promise<T> {
    const resolvedToken = useAuthStore.getState().accessToken ?? token
    const call = () =>
      this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: resolvedToken ? createAuthHeader(resolvedToken) : {},
        body: formData,
      }, 30000).then(res => this.handleResponse<T>(res, endpoint, call))
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
    username?: string
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

  static async updateLiveLocation(lat: number, lng: number): Promise<{ message: string }> {
    return this.patch<{ message: string }>(ENDPOINTS.UPDATE_LIVE_LOCATION, { lat, lng })
  }

  static async getMe(): Promise<ProfileResponse> {
    return this.get<ProfileResponse>(ENDPOINTS.GET_ME)
  }

  static async getProfile(userId: string): Promise<ProfileResponse> {
    const endpoint = ENDPOINTS.GET_PROFILE.replace(':id', userId)
    return this.get<ProfileResponse>(endpoint)
  }

  static async getUserProfile(userId: string): Promise<ExtendedProfile> {
    const endpoint = ENDPOINTS.GET_USER_PROFILE.replace(':id', userId)
    return this.get<ExtendedProfile>(endpoint)
  }

  static async searchUsers(q: string, page = 1, limit = 20): Promise<{ users: DiscoverUser[]; total: number }> {
    const params = new URLSearchParams({ q, page: String(page), limit: String(limit) })
    return this.get<{ users: DiscoverUser[]; total: number }>(`${ENDPOINTS.SEARCH_USERS}?${params}`)
  }

  static async followUser(userId: string): Promise<void> {
    const endpoint = ENDPOINTS.FOLLOW_USER.replace(':id', userId)
    await this.post<{ ok: boolean }>(endpoint, {})
  }

  static async unfollowUser(userId: string): Promise<void> {
    const endpoint = ENDPOINTS.FOLLOW_USER.replace(':id', userId)
    await this.delete<{ ok: boolean }>(endpoint)
  }

  static async getFollowers(userId: string, limit = 20, offset = 0): Promise<FollowsPage> {
    const ep = ENDPOINTS.USER_FOLLOWERS.replace(':id', userId)
    return this.get<FollowsPage>(`${ep}?limit=${limit}&offset=${offset}`)
  }

  static async getFollowing(userId: string, limit = 20, offset = 0): Promise<FollowsPage> {
    const ep = ENDPOINTS.USER_FOLLOWING.replace(':id', userId)
    return this.get<FollowsPage>(`${ep}?limit=${limit}&offset=${offset}`)
  }

  static async removeFollower(followerId: string): Promise<void> {
    const ep = ENDPOINTS.REMOVE_FOLLOWER.replace(':id', followerId)
    await this.delete<{ ok: boolean }>(ep)
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

  static async getLinkPreview(url: string): Promise<LinkPreview> {
    return this.get<LinkPreview>(`${ENDPOINTS.LINK_PREVIEW}?url=${encodeURIComponent(url)}`)
  }

  static async getMessages(convId: string, before?: string): Promise<Message[]> {
    const endpoint = ENDPOINTS.CONVERSATION_MESSAGES.replace(':id', convId)
    const qs = before ? `?before=${encodeURIComponent(before)}` : ''
    return this.get<Message[]>(`${endpoint}${qs}`)
  }

  static async getPartnerKey(convId: string): Promise<{ partner_id: string; partner_public_key: string | null }> {
    const endpoint = ENDPOINTS.CONVERSATION_PARTNER_KEY.replace(':id', convId)
    return this.get(endpoint)
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

  static async deleteConversation(convId: string): Promise<void> {
    const endpoint = ENDPOINTS.CONV_DELETE.replace(':id', convId)
    await this.delete<{ ok: boolean }>(endpoint)
  }

  static async reportMessage(messageId: string, reason: string, description?: string): Promise<void> {
    const endpoint = ENDPOINTS.MESSAGE_REPORT.replace(':id', messageId)
    await this.post<{ ok: boolean }>(endpoint, { reason, description: description ?? null })
  }

  static async unsendMessage(messageId: string): Promise<void> {
    const endpoint = ENDPOINTS.MESSAGE_UNSEND.replace(':id', messageId)
    await this.post<{ ok: boolean }>(endpoint, {})
  }

  static async editMessage(messageId: string, content: string): Promise<{ content: string; edited_at: string }> {
    const endpoint = ENDPOINTS.MESSAGE_EDIT.replace(':id', messageId)
    return this.patch<{ ok: boolean; content: string; edited_at: string }>(endpoint, { content })
  }

  static async deleteMessageForMe(messageId: string): Promise<void> {
    const endpoint = ENDPOINTS.MESSAGE_DELETE_FOR_ME.replace(':id', messageId)
    await this.post<{ ok: boolean }>(endpoint, {})
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  static async getNotifications(before?: string): Promise<AppNotification[]> {
    const q = before ? `?before=${encodeURIComponent(before)}` : ''
    return this.get<AppNotification[]>(`${ENDPOINTS.NOTIFICATIONS}${q}`)
  }

  static async getUnreadNotificationCount(): Promise<number> {
    const items = await this.get<AppNotification[]>(
      `${ENDPOINTS.NOTIFICATIONS}?unread_only=true&limit=1`
    )
    return items.length
  }

  static async markAllNotificationsRead(): Promise<void> {
    await this.patch<{ ok: boolean }>(ENDPOINTS.NOTIFICATIONS_READ_ALL, {})
  }

  static async markNotificationRead(notifId: string): Promise<void> {
    const endpoint = ENDPOINTS.NOTIFICATION_READ.replace(':id', notifId)
    await this.patch<{ ok: boolean }>(endpoint, {})
  }

  static async checkUsername(username: string): Promise<{ available: boolean; error?: string }> {
    return this.get<{ available: boolean; error?: string }>(
      `${ENDPOINTS.CHECK_USERNAME}?username=${encodeURIComponent(username)}`,
    )
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  static async getEvents(filters: {
    lat?: number
    lng?: number
    radius_km?: number
    category?: string
    is_free?: boolean
    date_range?: string
    q?: string
    min_lat?: number
    max_lat?: number
    min_lng?: number
    max_lng?: number
    limit?: number
  } = {}): Promise<EventSummary[]> {
    const params = new URLSearchParams()
    if (filters.lat != null) params.set('lat', String(filters.lat))
    if (filters.lng != null) params.set('lng', String(filters.lng))
    if (filters.radius_km != null) params.set('radius_km', String(filters.radius_km))
    if (filters.category) params.set('category', filters.category)
    if (filters.is_free != null) params.set('is_free', String(filters.is_free))
    if (filters.date_range) params.set('date_range', filters.date_range)
    if (filters.q) params.set('q', filters.q)
    if (filters.min_lat != null) params.set('min_lat', String(filters.min_lat))
    if (filters.max_lat != null) params.set('max_lat', String(filters.max_lat))
    if (filters.min_lng != null) params.set('min_lng', String(filters.min_lng))
    if (filters.max_lng != null) params.set('max_lng', String(filters.max_lng))
    if (filters.limit != null) params.set('limit', String(filters.limit))
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

  static async rsvpEvent(id: string, action: 'going' | 'cancel'): Promise<{ status: string; position?: number }> {
    return this.post<{ status: string; position?: number }>(ENDPOINTS.EVENT_RSVP.replace(':id', id), { action })
  }

  static async cancelEvent(id: string): Promise<void> {
    await this.delete<{ ok: boolean }>(ENDPOINTS.EVENT_DETAIL.replace(':id', id))
  }

  static async getEventWaitlist(id: string): Promise<{ waitlist: WaitlistEntry[]; total: number }> {
    return this.get<{ waitlist: WaitlistEntry[]; total: number }>(ENDPOINTS.EVENT_WAITLIST.replace(':id', id))
  }

  static async admitFromWaitlist(id: string): Promise<{ ok: boolean; admitted: { user_id: string; name: string } | null; waitlist_remaining: number }> {
    return this.post(ENDPOINTS.EVENT_WAITLIST_ADMIT.replace(':id', id), {})
  }

  static async getEventAttendees(id: string): Promise<{ attendees: EventAttendee[]; total: number }> {
    return this.get<{ attendees: EventAttendee[]; total: number }>(
      ENDPOINTS.EVENT_ATTENDEES.replace(':id', id),
    )
  }

  static async getEventGuests(id: string): Promise<{ guests: EventGuest[]; total: number; waitlist: EventGuest[] }> {
    return this.get<{ guests: EventGuest[]; total: number; waitlist: EventGuest[] }>(
      ENDPOINTS.EVENT_GUESTS.replace(':id', id),
    )
  }

  static async getMyTicket(eventId: string): Promise<TicketInfo> {
    return this.get<TicketInfo>(ENDPOINTS.EVENT_TICKET.replace(':id', eventId))
  }

  static async checkinAttendee(
    eventId: string,
    ticketToken: string,
    method: 'qr_scan' | 'manual_host' = 'qr_scan',
  ): Promise<{ ok: boolean; already_checked_in?: boolean; name: string; username?: string | null; method?: string }> {
    return this.post(ENDPOINTS.EVENT_CHECKIN.replace(':id', eventId), { ticket_token: ticketToken, method })
  }

  static async submitReview(eventId: string, rating: number, body?: string): Promise<{ ok: boolean }> {
    return this.post(ENDPOINTS.EVENT_REVIEWS.replace(':id', eventId), { rating, body: body ?? null })
  }

  static async getEventReviews(eventId: string): Promise<{ avg_rating: number | null; count: number; reviews: ReviewItem[] }> {
    return this.get(ENDPOINTS.EVENT_REVIEWS.replace(':id', eventId))
  }

  static async getFreeSlots(): Promise<{ used: number; limit: number; resets_on: string }> {
    return this.get(ENDPOINTS.EVENT_FREE_SLOTS)
  }

  static async reportEvent(eventId: string, reason: string, description?: string): Promise<{ ok: boolean }> {
    return this.post(ENDPOINTS.EVENT_REPORT.replace(':id', eventId), { reason, description: description ?? null })
  }

  // ── Wallet ─────────────────────────────────────────────────────────────────

  static async getWallet(): Promise<{ balance: number; transactions: WalletTransaction[] }> {
    return this.get(ENDPOINTS.WALLET)
  }

  static async submitFeedback(text: string): Promise<{ ok: boolean }> {
    return this.post(ENDPOINTS.FEEDBACK, { text })
  }

  static async submitSupport(topic: string, message: string): Promise<{ ok: boolean }> {
    return this.post(ENDPOINTS.SUPPORT, { topic, message })
  }

  static async deleteAccount(): Promise<{ ok: boolean }> {
    return this.delete(ENDPOINTS.DELETE_ACCOUNT)
  }

  static async setDiscoverable(discoverable: boolean): Promise<{ ok: boolean; discoverable: boolean }> {
    return this.patch(ENDPOINTS.SET_DISCOVERABLE, { discoverable })
  }

  static async setPublicKey(publicKey: string): Promise<{ ok: boolean }> {
    return this.patch(ENDPOINTS.SET_PUBLIC_KEY, { public_key: publicKey })
  }


  // ── Payments ───────────────────────────────────────────────────────────────

  static async getPaymentPublicKey(): Promise<{ key: string }> {
    return this.get(ENDPOINTS.PAYMENT_PUBLIC_KEY)
  }

  static async createPaymentOrder(eventId: string, walletAmount = 0): Promise<PaymentOrderResponse> {
    return this.post(ENDPOINTS.PAYMENT_CREATE_ORDER, { event_id: eventId, wallet_amount: walletAmount })
  }

  static async verifyPayment(body: {
    event_id: string
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    wallet_amount?: number
  }): Promise<{ ok: boolean; status: string }> {
    return this.post(ENDPOINTS.PAYMENT_VERIFY, body)
  }

  static async walletPay(eventId: string): Promise<{ ok: boolean; status: string }> {
    return this.post(ENDPOINTS.PAYMENT_WALLET_PAY, { event_id: eventId })
  }

  static async getSavedUpiId(): Promise<{ upi_id: string; name: string } | null> {
    try {
      return await this.get(ENDPOINTS.PAYMENT_SAVED_UPI)
    } catch {
      return null
    }
  }

  static async saveUpiId(upi_id: string, name: string): Promise<{ ok: boolean }> {
    return this.post(ENDPOINTS.PAYMENT_SAVED_UPI, { upi_id, name })
  }

  static async createQrPayment(eventId: string, walletAmount = 0): Promise<{
    qr_id: string; image_url: string; payment_url: string; amount_inr: number; expires_at: string
  }> {
    return this.post(ENDPOINTS.PAYMENT_CREATE_QR, { event_id: eventId, wallet_amount: walletAmount })
  }

  static async getQrStatus(qrId: string): Promise<{ status: 'pending' | 'paid' | 'expired' }> {
    return this.get(ENDPOINTS.PAYMENT_QR_STATUS.replace(':id', qrId))
  }

  static async getMyReview(eventId: string): Promise<{ rating: number; body: string | null } | null> {
    try {
      return await this.get(`/events/${eventId}/reviews/me`)
    } catch {
      return null
    }
  }

  static async getMyHostedEvents(): Promise<EventSummary[]> {
    return this.get<EventSummary[]>('/events/hosted')
  }

  static async getMyJoinedEvents(): Promise<EventSummary[]> {
    return this.get<EventSummary[]>('/events/joined')
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  static async uploadPhoto(uri: string, position: number): Promise<string> {
    const filename = uri.split('/').pop() ?? 'photo.jpg'
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg'

    const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_PHOTO}`
    let token = useAuthStore.getState().accessToken
    let res = await this.fsUpload(url, uri, mime, token, { position: String(position) })
    if (res.status === 401) {
      token = await this.refreshAccessToken()
      res = await this.fsUpload(url, uri, mime, token, { position: String(position) })
    }

    if (res.status < 200 || res.status >= 300) {
      let detail = `Upload failed (${res.status})`
      try { detail = JSON.parse(res.body)?.detail ?? detail } catch { }
      throw Object.assign(new Error(detail), { status: res.status })
    }
    try {
      return JSON.parse(res.body).url
    } catch {
      throw new Error('Invalid server response')
    }
  }

  static async uploadEventPhoto(uri: string, position: number = 0): Promise<string> {
    const filename = uri.split('/').pop() ?? 'photo.jpg'
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg'

    const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_EVENT_PHOTO}`
    let token = useAuthStore.getState().accessToken
    let res = await this.fsUpload(url, uri, mime, token, { position: String(position) })
    if (res.status === 401) {
      token = await this.refreshAccessToken()
      res = await this.fsUpload(url, uri, mime, token, { position: String(position) })
    }

    if (res.status < 200 || res.status >= 300) {
      let detail = `Upload failed (${res.status})`
      try { detail = JSON.parse(res.body)?.detail ?? detail } catch { }
      throw new Error(detail)
    }
    try {
      return JSON.parse(res.body).url
    } catch {
      throw new Error('Invalid server response')
    }
  }

  static async swapPhotos(positionA: number, positionB: number): Promise<void> {
    await this.post<{ ok: boolean }>(ENDPOINTS.SWAP_PHOTOS, {
      position_a: positionA,
      position_b: positionB,
    })
  }

  static async reorderPhotos(updates: { id: string; position: number }[]): Promise<void> {
    await this.post<{ ok: boolean }>(ENDPOINTS.REORDER_PHOTOS, { updates })
  }

  static async deletePhoto(photoId: string): Promise<void> {
    const endpoint = ENDPOINTS.DELETE_PHOTO.replace('{id}', photoId)
    return this.delete<void>(endpoint)
  }

  static async uploadVoice(uri: string): Promise<string> {
    const ext = (uri.split('/').pop() ?? 'voice.m4a').split('.').pop()?.toLowerCase() ?? 'm4a'
    const mime = ext === 'mp4' ? 'audio/mp4' : ext === '3gp' ? 'audio/3gpp' : 'audio/m4a'

    const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_VOICE}`
    let token = useAuthStore.getState().accessToken
    let result = await this.fsUpload(url, uri, mime, token)
    if (result.status === 401) {
      token = await this.refreshAccessToken()
      result = await this.fsUpload(url, uri, mime, token)
    }

    if (result.status < 200 || result.status >= 300) {
      let detail = `Upload failed (${result.status})`
      try { detail = JSON.parse(result.body)?.detail ?? detail } catch { }
      throw new Error(detail)
    }

    try {
      return JSON.parse(result.body).url
    } catch {
      throw new Error('Invalid server response')
    }
  }

  static async uploadChatVoice(uri: string): Promise<string> {
    const ext = (uri.split('/').pop() ?? 'voice.m4a').split('.').pop()?.toLowerCase() ?? 'm4a'
    const mime = ext === 'mp4' ? 'audio/mp4' : ext === '3gp' ? 'audio/3gpp' : 'audio/m4a'

    const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_CHAT_VOICE}`
    let token = useAuthStore.getState().accessToken
    let result = await this.fsUpload(url, uri, mime, token)
    if (result.status === 401) {
      token = await this.refreshAccessToken()
      result = await this.fsUpload(url, uri, mime, token)
    }

    if (result.status < 200 || result.status >= 300) {
      let detail = `Upload failed (${result.status})`
      try { detail = JSON.parse(result.body)?.detail ?? detail } catch { }
      throw new Error(detail)
    }

    try {
      return JSON.parse(result.body).url
    } catch {
      throw new Error('Invalid server response')
    }
  }

  static async uploadChatMedia(uri: string): Promise<{ url: string; media_type: string }> {
    const ext = (uri.split('/').pop() ?? 'image.jpg').split('.').pop()?.toLowerCase() ?? 'jpg'
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif',
      mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v',
    }
    const mime = mimeMap[ext] ?? 'image/jpeg'

    const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_CHAT_MEDIA}`
    let token = useAuthStore.getState().accessToken
    let result = await this.fsUpload(url, uri, mime, token)
    if (result.status === 401) {
      token = await this.refreshAccessToken()
      result = await this.fsUpload(url, uri, mime, token)
    }

    if (result.status < 200 || result.status >= 300) {
      let detail = `Upload failed (${result.status})`
      try { detail = JSON.parse(result.body)?.detail ?? detail } catch { }
      throw new Error(detail)
    }

    try {
      return JSON.parse(result.body)
    } catch {
      throw new Error('Invalid server response')
    }
  }
  static async registerDeviceToken(token: string, platform: string): Promise<void> {
    await this.post(ENDPOINTS.DEVICE_TOKEN, { expo_token: token, platform })
  }

  static async removeDeviceToken(token: string): Promise<void> {
    const { accessToken } = useAuthStore.getState()
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.DEVICE_TOKEN}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ expo_token: token }),
    })
    if (!res.ok) throw new Error('remove token failed')
  }
}

export default ApiService

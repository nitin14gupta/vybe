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
  host_badges: string[]
  profile_complete: boolean
  is_host_onboarding_finished: boolean
  safety_agreement_accepted_at: string | null
  host_agreement_accepted_at: string | null
  host_agreement_signature_url: string | null
  photos: PhotoResponse[]
  name_changed_at: string | null
  last_seen_at: string | null
}

export interface PayoutDetailsResponse {
  payout_method: 'upi' | 'bank' | null
  upi_id_masked: string | null
  bank_masked: {
    account_holder_name: string
    account_number_masked: string
    ifsc_code: string
    bank_name: string
  } | null
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
  lat: number
  lng: number
}

export interface ProfileResponse extends UserResponse {
  vibers_count: number
  vibing_count: number
  host_avg_rating: number | null
  host_review_count: number
  is_following?: boolean
  is_blocked_by_me?: boolean
  is_blocked_by_them?: boolean
  is_deleted?: boolean
}

export interface ExtendedProfile extends ProfileResponse {
  mutual_count: number
  vibe_status: 'none' | 'pending' | 'connected' | 'cooldown'
  vibe_id: string | null
  vibe_sent_by_me: boolean
  cooldown_until: string | null
  conversation_id: string | null
  events_attending: EventSummary[]
  events_hosted: EventSummary[]
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
  platform_fee_inr: number
  host_commission_inr: number
  platform_profit_inr: number
  spots_left: number
  capacity: number
  distance_km: number | null
  cover_photos: EventPhoto[]
  host_id?: string | null
  host_name: string | null
  host_avatar: string | null
  host_is_deleted?: boolean
  age_restriction: number
  attendee_count: number
  attendee_avatars: string[]
  is_cancelled?: boolean
  waitlist_count: number
  is_waitlist_full: boolean
  // Relationship/relevance signals — only populated by a search-ranked
  // getEvents(q) call; false everywhere else.
  is_following_host?: boolean
  attended_host_before?: boolean
  paid_attended_host_before?: boolean
  is_hotlisted?: boolean
}

export interface MyEventsPage {
  events: EventSummary[]
  upcoming_count: number
  past_count: number
  has_more: boolean
}

export interface CalendarDaySummary {
  date: string
  has_joined: boolean
  has_hosted: boolean
  has_waitlisted: boolean
  has_other: boolean
}

export interface CalendarDayEvents {
  joined: EventSummary[]
  hosted: EventSummary[]
  waitlisted: EventSummary[]
  other: EventSummary[]
}

export interface EventDetail extends EventSummary {
  description: string | null
  rules: string | null
  host_id: string
  host_badges: string[]
  is_cancelled: boolean
  cancel_deadline: string
  edit_deadline: string
  my_ticket_token: string | null
  my_checked_in_at: string | null
  avg_rating: number | null
  review_count: number
  host_avg_rating: number | null
  host_review_count: number
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
  host_avatar: string | null
  attendee_count: number
}

export interface ReviewItem {
  id: string
  reviewer_id: string
  reviewer_name: string | null
  reviewer_avatar: string | null
  rating: number
  body: string | null
  created_at: string
}

export interface HostReviewItem extends ReviewItem {
  event_id: string
  event_title: string
}

export interface HostReviewEvent {
  id: string
  title: string
  event_type: string
  review_count: number
  avg_rating: number | null
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
  is_following?: boolean
  is_mutual?: boolean
  has_connection?: boolean
  same_city?: boolean
  shared_interests_count?: number
}

export interface VibeRequest {
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
  partner_last_seen_at: string | null
  last_message: string | null
  last_message_type: string | null
  last_sender_id: string | null
  last_sent_at: string | null
  unread_count: number
  last_message_at: string | null
  block_status?: 'none' | 'i_blocked' | 'they_blocked'
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
  event_title: string | null
  event_cover: string | null
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
  email?: string     // synthetic pay_<uid>@gorave.in
}

export interface BlockedUser {
  id: string
  name: string | null
  city: string | null
  avatar: string | null
  created_at: string
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  emoji: string | null
  source: 'manual' | 'device'
  created_at: string | null
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
  // Server-computed contextual action (follow back, send vibe, message, …) — see server/routes/notifications.py
  action?: 'follow' | 'send_vibe' | 'message' | null
  action_label?: string | null
  action_target_id?: string | null
  cover_photo?: string | null
}

// Categories a user can toggle off — gates PUSH delivery only, server-side
// (server/utils/push.py). The in-app notification list is unaffected.
export interface NotificationPrefs {
  social: boolean
  hosting: boolean
  attending: boolean
  payments: boolean
}

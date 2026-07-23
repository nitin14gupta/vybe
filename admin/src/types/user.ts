export interface UserListItem {
  id: string
  name: string | null
  username: string | null
  phone: string
  country_code: string
  city: string | null
  wallet_balance: number
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  purge_at: string | null
  is_locked: boolean
  created_at: string
  avatar: string | null
}

export interface UserListResponse {
  items: UserListItem[]
  total: number
  page: number
  page_size: number
}

export interface UserProfile {
  id: string
  phone: string
  country_code: string
  name: string | null
  dob: string | null
  gender: string | null
  city: string | null
  bio: string | null
  interests: string[]
  badges: string[]
  username: string | null
  voice_url: string | null
  wallet_balance: number
  profile_complete: boolean
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  purge_at: string | null
  is_locked: boolean
  locked_reason: string | null
  locked_at: string | null
  locked_by: string | null
  is_host_onboarding_finished: boolean
  created_at: string
  updated_at: string
}

export interface UserPhoto {
  id: string
  url: string
  position: number
  created_at: string
}

export interface HostedEvent {
  id: string
  title: string
  event_type: string
  date_time: string
  price_inr: number
  is_cancelled: boolean
  spots_left: number
  capacity: number
  created_at: string
  cover_photos: { url: string; position: number }[]
}

export interface JoinedEvent {
  id: string
  title: string
  event_type: string
  date_time: string
  price_inr: number
  status: string
  joined_at: string
  checked_in_at: string | null
}

export interface WalletTransactionRow {
  id: string
  amount_inr: number
  type: 'credit' | 'debit' | 'refund_requested'
  source: string
  description: string | null
  expires_at: string | null
  created_at: string
}

export interface UserReportRow {
  id: string
  reason: string
  created_at: string
  reported_name?: string
  reported_id?: string
  reporter_name?: string
  reporter_id?: string
}

export interface BlockRow {
  id: string
  created_at: string
  name: string | null
  user_id: string
}

export interface SupportRequestRow {
  id: string
  topic: string
  message: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
}

export interface AppFeedbackRow {
  id: string
  text: string
  created_at: string
}

export interface VibeRequestRow {
  id: string
  status: string
  created_at: string
  name: string | null
  user_id: string
}

export interface UserDetail {
  user: UserProfile
  photos: UserPhoto[]
  hosted_events: HostedEvent[]
  joined_events: JoinedEvent[]
  wallet_transactions: WalletTransactionRow[]
  reports_filed: UserReportRow[]
  reports_received: UserReportRow[]
  blocked_by_user: BlockRow[]
  blocked_the_user: BlockRow[]
  support_requests: SupportRequestRow[]
  app_feedback: AppFeedbackRow[]
  vibe_requests_sent: VibeRequestRow[]
  vibe_requests_received: VibeRequestRow[]
}

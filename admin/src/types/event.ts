export interface EventPhoto {
  url: string
  position: number
}

export interface EventListItem {
  id: string
  title: string
  event_type: string
  date_time: string
  price_inr: number
  is_free: boolean
  platform_fee_inr: number
  host_commission_inr: number
  platform_profit_inr: number
  is_cancelled: boolean
  capacity: number
  spots_left: number
  created_at: string
  cover_photos: EventPhoto[]
  host_id: string
  host_name: string | null
  attendee_count: number
}

export interface EventDetailInfo {
  id: string
  title: string
  description: string | null
  rules: string | null
  event_type: string
  date_time: string
  end_time: string | null
  capacity: number
  spots_left: number
  age_restriction: number
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  price_inr: number
  is_free: boolean
  platform_fee_inr: number
  host_commission_inr: number
  platform_profit_inr: number
  cover_photos: EventPhoto[]
  is_published: boolean
  is_cancelled: boolean
  created_at: string
  updated_at: string
  host_id: string
  host_name: string | null
  host_phone: string
  avg_rating: number | null
}

export interface EventAttendeeRow {
  id: string
  status?: string
  joined_at: string
  checked_in_at: string | null
  payment_id?: string | null
  offer_expires_at: string | null
  user_id: string
  name: string | null
  phone: string
}

export interface EventReviewRow {
  id: string
  rating: number
  body: string | null
  created_at: string
  user_id: string
  name: string | null
}

export interface EventReportRow {
  id: string
  reason: string
  description: string | null
  created_at: string
  user_id: string
  name: string | null
}

export interface EventDetailResponse {
  event: EventDetailInfo
  attendees: EventAttendeeRow[]
  waitlist: EventAttendeeRow[]
  reviews: EventReviewRow[]
  reports: EventReportRow[]
}

export interface RevenueStats {
  total_platform_fee: number
  total_host_commission: number
  total_revenue: number
}

export interface RevenueByDay {
  day: string
  platform_fee: number
  host_commission: number
}

export interface HostPayoutItem {
  host_id: string
  host_name: string | null
  host_phone: string
  payout_method: string | null
  has_payout_details: boolean
  paid_events_count: number
  gross_ticket_revenue: number
  commission_taken: number
  net_payable: number
}

export interface TopHost {
  host_id: string
  host_name: string | null
  paid_events_count: number
  gross_ticket_revenue: number
  commission_taken: number
  net_payable: number
}

export interface TopEventByAttendance {
  id: string
  title: string
  host_name: string | null
  attendee_count: number
  capacity: number
}

export interface TopEventByRating {
  id: string
  title: string
  host_name: string | null
  avg_rating: number
  review_count: number
}

export interface LeaderboardResponse {
  top_hosts: TopHost[]
  top_events_by_attendance: TopEventByAttendance[]
  top_events_by_rating: TopEventByRating[]
}

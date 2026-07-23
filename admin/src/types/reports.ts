export interface UserReportItem {
  id: string
  reason: string
  created_at: string
  reporter_id: string
  reporter_name: string | null
  reporter_phone: string
  reported_id: string
  reported_name: string | null
  reported_phone: string
}

export interface EventReportItem {
  id: string
  reason: string
  description: string | null
  created_at: string
  reporter_id: string
  reporter_name: string | null
  reporter_phone: string
  event_id: string
  event_title: string
  event_is_cancelled: boolean
}

export interface MessageReportItem {
  id: string
  reason: string
  description: string | null
  created_at: string
  reporter_id: string
  reporter_name: string | null
  reporter_phone: string
  message_id: string
  message_content: string | null
  message_content_type: string
  message_sent_at: string
  sender_id: string
  sender_name: string | null
}

export interface BlockItem {
  id: string
  created_at: string
  blocker_id: string
  blocker_name: string | null
  blocker_phone: string
  blocked_id: string
  blocked_name: string | null
  blocked_phone: string
}

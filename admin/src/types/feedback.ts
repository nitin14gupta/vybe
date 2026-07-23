export interface AppFeedbackItem {
  id: string
  text: string
  created_at: string
  user_id: string
  user_name: string | null
  user_phone: string
}

export interface SupportRequestItem {
  id: string
  topic: string
  message: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
  user_id: string
  user_name: string | null
  user_phone: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface DashboardStats {
  total_users: number
  locked_users: number
  active_events: number
  upcoming_events: number
  past_events: number
  cancelled_events: number
  wallet_liability: number
  open_tickets: number
}

export interface SignupsByDay {
  day: string
  count: number
}

export interface EventsByType {
  event_type: string
  count: number
}

export interface WalletFlowByDay {
  day: string
  credits: number
  debits: number
}

export interface SupportByStatus {
  status: string
  count: number
}

export interface DashboardResponse {
  stats: DashboardStats
  signups_by_day: SignupsByDay[]
  events_by_type: EventsByType[]
  wallet_flow_by_day: WalletFlowByDay[]
  support_by_status: SupportByStatus[]
}

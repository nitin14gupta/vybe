export interface WalletTransactionItem {
  id: string
  amount_inr: number
  type: 'credit' | 'debit' | 'refund_requested'
  source: 'event_refund' | 'ticket_purchase' | 'bank_refund_request'
  description: string | null
  expires_at: string | null
  created_at: string
  user_id: string
  user_name: string | null
  user_phone: string
}

export interface WalletStats {
  total_liability: number
  total_credits: number
  total_debits: number
  credit_count: number
  debit_count: number
}

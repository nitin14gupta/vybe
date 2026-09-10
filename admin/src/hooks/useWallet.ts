import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { WalletTransactionItem, WalletStats } from '@/types/wallet'
import type { PaginatedResponse } from '@/types/feedback'

export function useWalletStatsQuery() {
  return useQuery({
    queryKey: ['admin-wallet-stats'],
    queryFn: () => apiClient.get<WalletStats>('/admin/wallet/stats'),
  })
}

export function useWalletTransactionsQuery({
  type,
  source,
  q,
  page,
  pageSize,
}: {
  type: string
  source: string
  q: string
  page: number
  pageSize: number
}) {
  return useQuery({
    queryKey: ['admin-wallet-transactions', type, source, q, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (type) params.set('type', type)
      if (source) params.set('source', source)
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<WalletTransactionItem>>(`/admin/wallet/transactions?${params}`)
    },
  })
}

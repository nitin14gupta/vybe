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
    queryKey: ['admin-wallet-transactions', type, source, q, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (type) params.set('type', type)
      if (source) params.set('source', source)
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<WalletTransactionItem>>(`/admin/wallet/transactions?${params}`)
    },
  })
}

const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_PAGES = 20

/** Fetches every wallet transaction matching the given filters (not just the current page), for CSV export. */
export async function fetchAllWalletTransactions({
  type,
  source,
  q,
}: {
  type: string
  source: string
  q: string
}): Promise<WalletTransactionItem[]> {
  const all: WalletTransactionItem[] = []
  for (let page = 1; page <= EXPORT_MAX_PAGES; page++) {
    const params = new URLSearchParams({ page: String(page), page_size: String(EXPORT_PAGE_SIZE) })
    if (type) params.set('type', type)
    if (source) params.set('source', source)
    if (q) params.set('q', q)
    const res = await apiClient.get<PaginatedResponse<WalletTransactionItem>>(`/admin/wallet/transactions?${params}`)
    all.push(...res.items)
    if (all.length >= res.total || res.items.length === 0) break
  }
  return all
}

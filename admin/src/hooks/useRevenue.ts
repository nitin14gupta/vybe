import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { RevenueStats, RevenueByDay, HostPayoutItem, LeaderboardResponse } from '@/types/revenue'
import type { PaginatedResponse } from '@/types/feedback'

export function useRevenueStatsQuery() {
  return useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: () => apiClient.get<RevenueStats>('/admin/revenue/stats'),
  })
}

export function useRevenueByDayQuery() {
  return useQuery({
    queryKey: ['admin-revenue-by-day'],
    queryFn: () => apiClient.get<RevenueByDay[]>('/admin/revenue/by-day'),
  })
}

export function useRevenueHostsQuery({ q, page, pageSize }: { q: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['admin-revenue-hosts', q, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<HostPayoutItem>>(`/admin/revenue/hosts?${params}`)
    },
  })
}

const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_PAGES = 20

/** Fetches every host payout row matching the given filter (not just the current page), for CSV export. */
export async function fetchAllRevenueHosts({ q }: { q: string }): Promise<HostPayoutItem[]> {
  const all: HostPayoutItem[] = []
  for (let page = 1; page <= EXPORT_MAX_PAGES; page++) {
    const params = new URLSearchParams({ page: String(page), page_size: String(EXPORT_PAGE_SIZE) })
    if (q) params.set('q', q)
    const res = await apiClient.get<PaginatedResponse<HostPayoutItem>>(`/admin/revenue/hosts?${params}`)
    all.push(...res.items)
    if (all.length >= res.total || res.items.length === 0) break
  }
  return all
}

export function useRevenueLeaderboardQuery() {
  return useQuery({
    queryKey: ['admin-revenue-leaderboard'],
    queryFn: () => apiClient.get<LeaderboardResponse>('/admin/revenue/leaderboard'),
  })
}

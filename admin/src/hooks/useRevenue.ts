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
    queryKey: ['admin-revenue-hosts', q, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<HostPayoutItem>>(`/admin/revenue/hosts?${params}`)
    },
  })
}

export function useRevenueLeaderboardQuery() {
  return useQuery({
    queryKey: ['admin-revenue-leaderboard'],
    queryFn: () => apiClient.get<LeaderboardResponse>('/admin/revenue/leaderboard'),
  })
}

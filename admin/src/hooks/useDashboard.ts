import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { DashboardResponse } from '@/types/dashboard'

export function useDashboardQuery() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get<DashboardResponse>('/admin/dashboard'),
  })
}

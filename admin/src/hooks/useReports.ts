import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { UserReportItem, EventReportItem, MessageReportItem, BlockItem } from '@/types/reports'
import type { AuditLogItem } from '@/types/audit'
import type { PaginatedResponse } from '@/types/feedback'

const PAGE_SIZE = 20

function usePaginatedReports<T>(key: string, path: string, page: number) {
  return useQuery({
    queryKey: [key, page],
    queryFn: () => apiClient.get<PaginatedResponse<T>>(`${path}?page=${page}&page_size=${PAGE_SIZE}`),
  })
}

export function useUserReportsQuery(page: number) {
  return usePaginatedReports<UserReportItem>('admin-reports-users', '/admin/reports/users', page)
}

export function useEventReportsQuery(page: number) {
  return usePaginatedReports<EventReportItem>('admin-reports-events', '/admin/reports/events', page)
}

export function useMessageReportsQuery(page: number) {
  return usePaginatedReports<MessageReportItem>('admin-reports-messages', '/admin/reports/messages', page)
}

export function useBlocksQuery(page: number) {
  return usePaginatedReports<BlockItem>('admin-reports-blocks', '/admin/reports/blocks', page)
}

export function useAdminActivityQuery(page: number) {
  return usePaginatedReports<AuditLogItem>('admin-audit-log', '/admin/audit-log', page)
}

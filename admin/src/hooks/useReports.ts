import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { UserReportItem, EventReportItem, MessageReportItem, BlockItem } from '@/types/reports'
import type { AuditLogItem } from '@/types/audit'
import type { PaginatedResponse } from '@/types/feedback'

function usePaginatedReports<T>(
  key: string,
  path: string,
  page: number,
  pageSize: number,
  extraParams?: Record<string, string>,
) {
  return useQuery({
    queryKey: [key, page, pageSize, extraParams],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v) params.set(k, v)
        }
      }
      return apiClient.get<PaginatedResponse<T>>(`${path}?${params}`)
    },
  })
}

export function useUserReportsQuery(page: number, pageSize: number) {
  return usePaginatedReports<UserReportItem>('admin-reports-users', '/admin/reports/users', page, pageSize)
}

export function useEventReportsQuery(page: number, pageSize: number) {
  return usePaginatedReports<EventReportItem>('admin-reports-events', '/admin/reports/events', page, pageSize)
}

export function useMessageReportsQuery(page: number, pageSize: number) {
  return usePaginatedReports<MessageReportItem>('admin-reports-messages', '/admin/reports/messages', page, pageSize)
}

export function useBlocksQuery(page: number, pageSize: number) {
  return usePaginatedReports<BlockItem>('admin-reports-blocks', '/admin/reports/blocks', page, pageSize)
}

export function useAdminActivityQuery(
  page: number,
  pageSize: number = 20,
  filters?: { q?: string; action?: string },
) {
  return usePaginatedReports<AuditLogItem>('admin-audit-log', '/admin/audit-log', page, pageSize, {
    q: filters?.q ?? '',
    action: filters?.action ?? '',
  })
}

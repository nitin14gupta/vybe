import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { EventListItem, EventDetailResponse } from '@/types/event'
import type { PaginatedResponse } from '@/types/feedback'

export function useEventsQuery({ status, q, page, pageSize }: { status: string; q: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['admin-events', status, q, page],
    queryFn: () => {
      const params = new URLSearchParams({ status, page: String(page), page_size: String(pageSize) })
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<EventListItem>>(`/admin/events?${params}`)
    },
  })
}

export function useEventQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => apiClient.get<EventDetailResponse>(`/admin/events/${id}`),
    enabled: !!id,
  })
}

export function useCancelEventMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post(`/admin/events/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
  })
}

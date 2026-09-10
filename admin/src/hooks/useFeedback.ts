import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { AppFeedbackItem, SupportRequestItem, PaginatedResponse } from '@/types/feedback'

export function useSupportRequestsQuery({ status, page, pageSize }: { status: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['admin-support', status, page, pageSize],
    queryFn: () =>
      apiClient.get<PaginatedResponse<SupportRequestItem>>(
        `/admin/feedback/support?page=${page}&page_size=${pageSize}${status ? `&status=${status}` : ''}`,
      ),
  })
}

export function useUpdateSupportStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/feedback/support/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support'] })
    },
  })
}

export function useAppFeedbackQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['admin-app-feedback', page, pageSize],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AppFeedbackItem>>(`/admin/feedback/app-feedback?page=${page}&page_size=${pageSize}`),
  })
}

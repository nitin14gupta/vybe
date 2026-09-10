import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { UserListResponse, UserDetail, PayoutDetails } from '@/types/user'

export function useUsersQuery({ q, status, page, pageSize }: { q: string; status: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['admin-users', q, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      return apiClient.get<UserListResponse>(`/admin/users?${params}`)
    },
  })
}

export function useUserQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => apiClient.get<UserDetail>(`/admin/users/${id}`),
    enabled: !!id,
  })
}

export function useUserPayoutQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-user-payout', userId],
    queryFn: () => apiClient.get<PayoutDetails>(`/admin/users/${userId}/payout-details`),
    enabled: !!userId,
  })
}

export function useLockUserMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason?: string) => apiClient.patch(`/admin/users/${id}/lock`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUnlockUserMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.patch(`/admin/users/${id}/unlock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

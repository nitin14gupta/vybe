import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { UserListResponse, UserListItem, UserDetail, PayoutDetails } from '@/types/user'

export function useUsersQuery({ q, status, page, pageSize }: { q: string; status: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['admin-users', q, status, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      return apiClient.get<UserListResponse>(`/admin/users?${params}`)
    },
  })
}

const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_PAGES = 20

/** Fetches every user matching the given filters (not just the current page), for CSV export. */
export async function fetchAllUsers({ q, status }: { q: string; status: string }): Promise<UserListItem[]> {
  const all: UserListItem[] = []
  for (let page = 1; page <= EXPORT_MAX_PAGES; page++) {
    const params = new URLSearchParams({ page: String(page), page_size: String(EXPORT_PAGE_SIZE) })
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    const res = await apiClient.get<UserListResponse>(`/admin/users?${params}`)
    all.push(...res.items)
    if (all.length >= res.total || res.items.length === 0) break
  }
  return all
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

import { useState, useEffect, useCallback } from 'react'
import ApiService, { DiscoverUser } from '@/api/apiService'

export interface DiscoverFilters {
  gender?: string
  minAge?: number
  maxAge?: number
  maxDistanceKm?: number
}

export function useDiscover() {
  const [users, setUsers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [filters, setFiltersState] = useState<DiscoverFilters>({})

  const load = useCallback(async (f: DiscoverFilters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await ApiService.getDiscover(30, f)
      setUsers(data)
      setCurrentIdx(0)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filters) }, [load])

  const setFilters = useCallback((f: DiscoverFilters) => {
    setFiltersState(f)
    load(f)
  }, [load])

  const advance = () => setCurrentIdx(i => i + 1)

  const handlePass = useCallback((userId: string) => {
    advance()
    if (userId) ApiService.passUser(userId).catch(() => {})
  }, [])

  const handleFollow = useCallback((userId: string) => {
    advance()
    if (userId) ApiService.followUser(userId).catch(() => {})
  }, [])

  const handleVybe = useCallback((userId: string) => {
    advance()
    if (userId) {
      ApiService.sendVibe(userId).catch(() => {})
      ApiService.followUser(userId).catch(() => {})
    }
  }, [])

  const handleStar = useCallback((userId: string) => {
    advance()
    if (userId) ApiService.followUser(userId).catch(() => {})
  }, [])

  const hasMore = currentIdx < users.length

  return {
    loading,
    error,
    users,
    currentIdx,
    hasMore,
    filters,
    setFilters,
    activeUser: users[currentIdx] ?? null,
    nextUser: users[currentIdx + 1] ?? null,
    backUser: users[currentIdx + 2] ?? null,
    handlePass,
    handleFollow,
    handleVybe,
    handleStar,
    reload: () => load(filters),
  }
}

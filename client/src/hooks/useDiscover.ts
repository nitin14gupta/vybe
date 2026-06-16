import { useState, useEffect, useCallback } from 'react'
import ApiService, { DiscoverUser } from '@/api/apiService'

export function useDiscover() {
  const [users, setUsers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ApiService.getDiscover(30)
      setUsers(data)
      setCurrentIdx(0)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handlePass = useCallback(() => {
    setCurrentIdx(i => i + 1)
  }, [])

  const handleVybe = useCallback((_userId: string) => {
    setCurrentIdx(i => i + 1)
  }, [])

  const handleStar = useCallback((_userId: string) => {
    setCurrentIdx(i => i + 1)
  }, [])

  const hasMore = currentIdx < users.length

  return {
    loading,
    error,
    users,
    currentIdx,
    hasMore,
    activeUser: users[currentIdx] ?? null,
    nextUser: users[currentIdx + 1] ?? null,
    backUser: users[currentIdx + 2] ?? null,
    handlePass,
    handleVybe,
    handleStar,
    reload: load,
  }
}

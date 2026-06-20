import { useState, useCallback, useRef, useEffect } from 'react'
import ApiService, { FollowUser } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { useAuthStore } from '@/store/auth'

const PAGE = 20

export function useFollowsList(userId: string, type: 'followers' | 'following') {
  const showPill = usePillStore(s => s.show)
  const myId = useAuthStore(s => s.userId)
  const isMyProfile = userId === myId

  const [allUsers, setAllUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const offset = useRef(0)

  const fetchPage = useCallback(async (off: number, append: boolean) => {
    try {
      const page = type === 'followers'
        ? await ApiService.getFollowers(userId, PAGE, off)
        : await ApiService.getFollowing(userId, PAGE, off)
      setAllUsers(prev => append ? [...prev, ...page.users] : page.users)
      setHasMore(page.has_more)
      offset.current = off + page.users.length
      setError(false)
    } catch {
      setError(true)
      if (!append) showPill('Could not load list', 'error')
    }
  }, [userId, type, showPill])

  const load = useCallback(async () => {
    setLoading(true)
    offset.current = 0
    await fetchPage(0, false)
    setLoading(false)
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchPage(offset.current, true)
    setLoadingMore(false)
  }, [loadingMore, hasMore, fetchPage])

  useEffect(() => { load() }, [load])

  const toggleFollow = useCallback(async (targetId: string) => {
    const user = allUsers.find(u => u.id === targetId)
    if (!user) return
    const wasFollowing = user.is_following
    setAllUsers(prev => prev.map(u => u.id === targetId ? { ...u, is_following: !wasFollowing } : u))
    try {
      if (wasFollowing) await ApiService.unfollowUser(targetId)
      else await ApiService.followUser(targetId)
    } catch {
      setAllUsers(prev => prev.map(u => u.id === targetId ? { ...u, is_following: wasFollowing } : u))
      showPill('Action failed', 'error')
    }
  }, [allUsers, showPill])

  const removeFollower = useCallback(async (followerId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== followerId))
    try {
      await ApiService.removeFollower(followerId)
    } catch {
      showPill('Could not remove follower', 'error')
      load()
    }
  }, [showPill, load])

  const filtered = query.trim()
    ? allUsers.filter(u => {
        const q = query.toLowerCase()
        return (
          u.name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.city?.toLowerCase().includes(q)
        )
      })
    : allUsers

  return {
    users: filtered,
    totalCount: allUsers.length,
    loading,
    loadingMore,
    hasMore,
    error,
    query,
    setQuery,
    isMyProfile,
    myId,
    load,
    loadMore,
    toggleFollow,
    removeFollower,
  }
}

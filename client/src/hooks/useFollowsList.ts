import { useState, useCallback, useRef, useEffect } from 'react'
import ApiService, { FollowUser } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { useAuthStore } from '@/store/auth'

const PAGE = 20

export function useFollowsList(userId: string, type: 'followers' | 'following', enabled: boolean) {
  const showPill = usePillStore(s => s.show)
  const myId = useAuthStore(s => s.userId)
  const isMyProfile = userId === myId

  const [allUsers, setAllUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
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
      if (!append) showPill("Couldn't load the list, try again", 'error')
    }
  }, [userId, type, showPill])

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    offset.current = 0
    await fetchPage(0, false)
    if (isRefresh) setRefreshing(false)
    else setLoading(false)
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchPage(offset.current, true)
    setLoadingMore(false)
  }, [loadingMore, hasMore, fetchPage])

  // Only fetches once this list is actually needed — the caller marks
  // `enabled` true the first time its tab becomes active, and it stays true
  // from then on, so this fires exactly once per tab, not on every mount.
  useEffect(() => {
    if (enabled) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const inFlightRef = useRef<Set<string>>(new Set())

  const toggleFollow = useCallback(async (targetId: string) => {
    if (inFlightRef.current.has(targetId)) return
    const user = allUsers.find(u => u.id === targetId)
    if (!user) return
    const wasFollowing = user.is_following
    inFlightRef.current.add(targetId)
    setAllUsers(prev => prev.map(u => u.id === targetId ? { ...u, is_following: !wasFollowing } : u))
    try {
      if (wasFollowing) await ApiService.unfollowUser(targetId)
      else await ApiService.followUser(targetId)
      showPill(wasFollowing ? `Unfollowed ${user.name ?? 'them'}` : `Following ${user.name ?? 'them'}`, 'default')
    } catch {
      setAllUsers(prev => prev.map(u => u.id === targetId ? { ...u, is_following: wasFollowing } : u))
      showPill("Couldn't do that, try again", 'error')
    } finally {
      inFlightRef.current.delete(targetId)
    }
  }, [allUsers, showPill])

  const removeFollower = useCallback(async (followerId: string) => {
    const user = allUsers.find(u => u.id === followerId)
    setAllUsers(prev => prev.filter(u => u.id !== followerId))
    try {
      await ApiService.removeFollower(followerId)
      showPill(`Removed ${user?.name ?? 'them'}`, 'default')
    } catch {
      showPill("Couldn't remove them, try again", 'error')
      load()
    }
  }, [allUsers, showPill, load])

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
    refreshing,
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

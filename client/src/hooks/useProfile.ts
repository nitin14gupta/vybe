import { useState, useEffect, useCallback } from 'react'
import { getMe, getProfile, followUser, unfollowUser } from '@/api/user'
import type { ProfileResponse } from '@/api/user'

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwn = !userId

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = userId ? await getProfile(userId) : await getMe()
      setProfile(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const followToggle = async () => {
    if (!profile || isOwn) return
    const following = profile.is_following
    // Optimistic update
    setProfile(p => p ? {
      ...p,
      is_following: !following,
      vibers_count: p.vibers_count + (following ? -1 : 1),
    } : p)
    try {
      if (following) {
        await unfollowUser(profile.id)
      } else {
        await followUser(profile.id)
      }
    } catch {
      // Revert on failure
      setProfile(p => p ? {
        ...p,
        is_following: following,
        vibers_count: p.vibers_count + (following ? 1 : -1),
      } : p)
    }
  }

  return { profile, loading, error, isOwn, followToggle, refresh: fetch }
}

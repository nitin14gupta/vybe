import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { getMe, getProfile, followUser, unfollowUser } from '@/api/user'
import type { ProfileResponse } from '@/api/user'
import { peekCached, setCached } from '@/lib/queryCache'
import { CacheKeys } from '@/constants'
import { usePillStore } from '@/store/pillStore'

// "Own profile" barely changes between one tab visit and the next, so
// blocking on a full network round-trip (and a BrandedLoader flash) every
// single time you tap the Profile tab is wasted wait. Stale-while-revalidate:
// paint whatever we last knew instantly, still refetch every focus like
// before, just don't blank the screen to do it.
const cacheKey = CacheKeys.profile

// Two separate useProfile() instances exist for the same "me" profile — the
// tab-bar layout (avatar) and the Profile screen itself — and both refetch on
// focus. Returning from a pushed screen (follows, host-reviews, ...) refocuses
// both at once, which without this would fire two identical GET requests.
// Sharing the in-flight promise by cache key collapses that into one.
const inFlightRequests: Record<string, Promise<ProfileResponse>> = {}

function fetchProfileDeduped(key: string, userId?: string): Promise<ProfileResponse> {
  const existing = inFlightRequests[key]
  if (existing) return existing
  const request = (userId ? getProfile(userId) : getMe()).finally(() => {
    delete inFlightRequests[key]
  })
  inFlightRequests[key] = request
  return request
}

export function useProfile(userId?: string) {
  const showPill = usePillStore(s => s.show)
  const key = cacheKey(userId)
  const [profile, setProfile] = useState<ProfileResponse | null>(() => peekCached<ProfileResponse>(key))
  const [loading, setLoading] = useState(() => peekCached<ProfileResponse>(key) === null)
  const [error, setError] = useState<string | null>(null)

  const isOwn = !userId

  const fetch = useCallback(async () => {
    // Only show the blocking loader when we have nothing at all to show yet —
    // a background revalidate should update silently.
    if (!peekCached<ProfileResponse>(key)) setLoading(true)
    setError(null)
    try {
      const data = await fetchProfileDeduped(key, userId)
      setProfile(data)
      setCached(key, data)
    } catch (e: any) {
      // A transient failure shouldn't wipe a perfectly good cached profile
      // that's already on screen — only surface the error if we've got nothing.
      if (!peekCached<ProfileResponse>(key)) setError(e?.message ?? 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId, key])

  useFocusEffect(
    useCallback(() => {
      fetch()
    }, [fetch])
  )

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
      showPill("Couldn't do that, try again", 'error')
    }
  }

  return { profile, loading, error, isOwn, followToggle, refresh: fetch }
}

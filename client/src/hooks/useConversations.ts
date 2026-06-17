import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { Conversation, VybeRequest } from '@/api/apiService'

export function useConversations() {
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([])
  const [lockedConversations, setLockedConversations] = useState<Conversation[]>([])
  const [pendingVibes, setPendingVibes] = useState<VybeRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [convData, vibeData] = await Promise.all([
        ApiService.getConversations(),
        ApiService.getReceivedVibes(),
      ])
      setActiveConversations(convData.active)
      setLockedConversations(convData.locked)
      setPendingVibes(vibeData)
    } catch (e) {
      // Silently ignore — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  const acceptVybe = useCallback(async (vibeId: string, icebreaker: string) => {
    try {
      await ApiService.respondToVibe(vibeId, 'accept', icebreaker)
      await refresh()
    } catch {}
  }, [refresh])

  const passVybe = useCallback(async (vibeId: string) => {
    try {
      await ApiService.respondToVibe(vibeId, 'pass')
      setPendingVibes(prev => prev.filter(v => v.id !== vibeId))
    } catch {}
  }, [])

  return {
    activeConversations,
    lockedConversations,
    pendingVibes,
    loading,
    refresh,
    acceptVybe,
    passVybe,
  }
}

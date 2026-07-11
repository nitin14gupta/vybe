import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { Conversation, VybeRequest } from '@/api/apiService'
import { loadOrCreateKeypair, decryptText } from '@/lib/e2ee'

function decryptPreview(conv: Conversation): Conversation {
  if (conv.last_message_type !== 'text' || !conv.last_message) return conv
  return { ...conv, last_message: decryptText(conv.last_message, conv.partner_public_key) }
}

export function useConversations() {
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([])
  const [lockedConversations, setLockedConversations] = useState<Conversation[]>([])
  const [pendingVibes, setPendingVibes] = useState<VybeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setError(false)
    try {
      await loadOrCreateKeypair()
      const [convData, vibeData] = await Promise.all([
        ApiService.getConversations(),
        ApiService.getReceivedVibes(),
      ])
      const byRecent = (a: Conversation, b: Conversation) =>
        (b.last_sent_at ?? b.last_message_at ?? '').localeCompare(
          a.last_sent_at ?? a.last_message_at ?? '',
        )
      setActiveConversations([...convData.active].sort(byRecent).map(decryptPreview))
      setLockedConversations([...convData.locked].sort(byRecent).map(decryptPreview))
      setPendingVibes([...vibeData].sort((a, b) => b.created_at.localeCompare(a.created_at)))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  const acceptVybe = useCallback(async (vibeId: string, icebreaker: string): Promise<void> => {
    await ApiService.respondToVibe(vibeId, 'accept', icebreaker)
    await refresh()
  }, [refresh])

  const passVybe = useCallback(async (vibeId: string): Promise<void> => {
    await ApiService.respondToVibe(vibeId, 'pass')
    setPendingVibes(prev => prev.filter(v => v.id !== vibeId))
  }, [])

  return {
    activeConversations,
    lockedConversations,
    pendingVibes,
    loading,
    error,
    refresh,
    acceptVybe,
    passVybe,
  }
}

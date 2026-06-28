import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { useOnboardingStore } from '@/store/onboarding'
import { setInterests, getInterests } from '@/api/user'
import type { InterestResponse } from '@/api/user'
import { usePillStore } from '@/store/pillStore'

const MAX_INTERESTS = 4

// Fallback if backend is unreachable
const FALLBACK: InterestResponse[] = [
  { name: 'Music', emoji: '🎵' }, { name: 'Travel', emoji: '✈️' },
  { name: 'Food', emoji: '🍕' }, { name: 'Sports', emoji: '⚽' },
  { name: 'Art', emoji: '🎨' }, { name: 'Movies', emoji: '🎬' },
  { name: 'Gaming', emoji: '🎮' }, { name: 'Dance', emoji: '💃' },
  { name: 'Fitness', emoji: '🏋️' }, { name: 'Comedy', emoji: '😂' },
  { name: 'Photography', emoji: '📸' }, { name: 'Fashion', emoji: '👗' },
  { name: 'Tech', emoji: '💻' }, { name: 'Books', emoji: '📚' },
  { name: 'Cooking', emoji: '🍳' }, { name: 'Nightlife', emoji: '🌃' },
  { name: 'Hiking', emoji: '🥾' }, { name: 'Yoga', emoji: '🧘' },
]

export function useInterests() {
  const store = useOnboardingStore()
  const showPill = usePillStore.getState().show
  const [availableInterests, setAvailableInterests] = useState<InterestResponse[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getInterests()
      .then(data => setAvailableInterests(data))
      .catch(() => setAvailableInterests(FALLBACK))
      .finally(() => setLoadingList(false))
  }, [])

  const selected = store.interests
  const atMax = selected.length >= MAX_INTERESTS
  const canProceed = selected.length >= 3
  const remaining = Math.max(0, 3 - selected.length)

  const toggle = (label: string) => {
    if (selected.includes(label)) {
      store.setField('interests', selected.filter(x => x !== label))
    } else if (!atMax) {
      store.setField('interests', [...selected, label])
    }
  }

  const handleNext = async () => {
    if (!canProceed) return
    setLoading(true)
    try {
      await setInterests(selected)
    } catch {
      showPill('Failed to save interests — check your connection', 'error')
    }
    setLoading(false)
    router.push('/(onboarding)/location')
  }

  return {
    availableInterests,
    loadingList,
    selected,
    atMax,
    canProceed,
    remaining,
    loading,
    toggle,
    handleNext,
  }
}

import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getMe, updateProfile, setInterests as apiSetInterests, setLocation as apiSetLocation, getBadges } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'
import type { ProfileResponse } from '@/api/user'

interface OriginalState {
  name: string
  username: string
  bio: string
  gender: string
  interests: string[]
  badges: string[]
}

export function useEditProfile() {
  const onboardingStore = useOnboardingStore()
  const showPill = usePillStore(s => s.show)

  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [gender, setGender] = useState('')
  const [bio, setBio] = useState('')
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [availableBadges, setAvailableBadges] = useState<string[]>([])
  const [original, setOriginal] = useState<OriginalState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getMe(), getBadges()])
      .then(([p, badges]) => {
        setProfile(p)
        setName(p.name ?? '')
        setUsername(p.username ?? '')
        setGender(p.gender ?? '')
        setBio(p.bio ?? '')
        setSelectedBadges(p.badges ?? [])
        setAvailableBadges(badges)
        onboardingStore.setField('city', p.city ?? null)
        onboardingStore.setField('interests', p.interests ?? [])
        setOriginal({
          name: p.name ?? '',
          username: p.username ?? '',
          bio: p.bio ?? '',
          gender: p.gender ?? '',
          interests: [...(p.interests ?? [])].sort(),
          badges: [...(p.badges ?? [])].sort(),
        })
      })
      .catch(() => showPill('Failed to load profile', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const selectedInterests = onboardingStore.interests

  const isDirty = original
    ? name !== original.name
      || username !== original.username
      || bio !== original.bio
      || gender !== original.gender
      || JSON.stringify([...selectedInterests].sort()) !== JSON.stringify(original.interests)
      || JSON.stringify([...selectedBadges].sort()) !== JSON.stringify(original.badges)
    : false

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev => {
      if (prev.includes(badge)) return prev.filter(b => b !== badge)
      if (prev.length >= 4) return prev
      return [...prev, badge]
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showPill('Name cannot be empty', 'error')
      return
    }
    setSaving(true)
    try {
      const store = useOnboardingStore.getState()
      const payload: Parameters<typeof updateProfile>[0] = {
        name: name.trim(),
        gender,
        bio: bio.trim() || undefined,
        badges: selectedBadges,
      }
      if (username.trim() && username.trim() !== original?.username) {
        payload.username = username.trim()
      }
      await Promise.all([
        updateProfile(payload),
        store.interests.length >= 3 ? apiSetInterests(store.interests) : Promise.resolve(),
        store.city ? apiSetLocation(store.city, store.lat ?? 0, store.lng ?? 0) : Promise.resolve(),
      ])
      setOriginal({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        gender,
        interests: [...selectedInterests].sort(),
        badges: [...selectedBadges].sort(),
      })
      showPill('Profile updated!', 'default')
      setTimeout(() => router.back(), 900)
    } catch (e: any) {
      const msg = e?.detail || e?.message || 'Failed to save'
      showPill(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    name, setName,
    username, setUsername,
    originalUsername: original?.username ?? null,
    bio, setBio,
    gender, setGender,
    selectedBadges,
    availableBadges,
    toggleBadge,
    isDirty,
    loading,
    saving,
    handleSave,
  }
}

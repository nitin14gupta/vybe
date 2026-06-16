import { useState, useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { getMe, updateProfile, setInterests as apiSetInterests, setLocation as apiSetLocation, getBadges } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import type { ProfileResponse } from '@/api/user'
import type { ToastType } from '@/components/ui'

interface OriginalState {
  name: string
  bio: string
  gender: string
  interests: string[]
  badges: string[]
}

export function useEditProfile() {
  const onboardingStore = useOnboardingStore()

  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [bio, setBio] = useState('')
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [availableBadges, setAvailableBadges] = useState<string[]>([])
  const [original, setOriginal] = useState<OriginalState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ key: number; message: string; type: ToastType } | null>(null)
  const toastKeyRef = useRef(0)

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ key: ++toastKeyRef.current, message, type })
  }

  useEffect(() => {
    Promise.all([getMe(), getBadges()])
      .then(([p, badges]) => {
        setProfile(p)
        setName(p.name ?? '')
        setGender(p.gender ?? '')
        setBio(p.bio ?? '')
        setSelectedBadges(p.badges ?? [])
        setAvailableBadges(badges)
        onboardingStore.setField('city', p.city ?? null)
        onboardingStore.setField('interests', p.interests ?? [])
        setOriginal({
          name: p.name ?? '',
          bio: p.bio ?? '',
          gender: p.gender ?? '',
          interests: [...(p.interests ?? [])].sort(),
          badges: [...(p.badges ?? [])].sort(),
        })
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const selectedInterests = onboardingStore.interests

  const isDirty = original
    ? name !== original.name
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
      showToast('Name cannot be empty', 'error')
      return
    }
    setSaving(true)
    try {
      const store = useOnboardingStore.getState()
      await Promise.all([
        updateProfile({ name: name.trim(), gender, bio: bio.trim() || undefined, badges: selectedBadges }),
        store.interests.length >= 3 ? apiSetInterests(store.interests) : Promise.resolve(),
        store.city ? apiSetLocation(store.city, store.lat ?? 0, store.lng ?? 0) : Promise.resolve(),
      ])
      // Update original so dirty tracking resets after save
      setOriginal({
        name: name.trim(),
        bio: bio.trim(),
        gender,
        interests: [...selectedInterests].sort(),
        badges: [...selectedBadges].sort(),
      })
      showToast('Profile updated!', 'success')
      setTimeout(() => router.back(), 900)
    } catch (e: any) {
      showToast(String(e?.message ?? 'Failed to save'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    name, setName,
    bio, setBio,
    gender, setGender,
    selectedBadges,
    availableBadges,
    toggleBadge,
    isDirty,
    loading,
    saving,
    toast,
    handleSave,
  }
}

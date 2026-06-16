import { useState, useRef } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { uploadPhoto } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import type { ToastType } from '@/components/ui'

export type SlotState = 'idle' | 'uploading' | 'done' | 'error'

export const PHOTO_SLOTS = 5

export function usePhotos() {
  const store = useOnboardingStore()

  const [localUris, setLocalUris] = useState<(string | null)[]>(Array(PHOTO_SLOTS).fill(null))
  const [slotStates, setSlotStates] = useState<SlotState[]>(Array(PHOTO_SLOTS).fill('idle'))
  const [nextLoading, setNextLoading] = useState(false)
  const [toast, setToast] = useState<{ key: number; message: string; type: ToastType } | null>(null)

  const toastKeyRef = useRef(0)
  const serverUrls = useRef<(string | null)[]>(Array(PHOTO_SLOTS).fill(null))
  const uploadGens = useRef<number[]>(Array(PHOTO_SLOTS).fill(0))
  const uploadPromises = useRef<Map<number, Promise<void>>>(new Map())

  const hasAnyPhoto = localUris.some(Boolean)

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ key: ++toastKeyRef.current, message, type })
  }

  const setSlotState = (index: number, state: SlotState) =>
    setSlotStates(prev => { const n = [...prev]; n[index] = state; return n })

  const startUpload = (uri: string, index: number) => {
    const gen = ++uploadGens.current[index]
    const promise = uploadPhoto(uri, index)
      .then(url => {
        if (uploadGens.current[index] !== gen) return
        serverUrls.current[index] = url
        setSlotState(index, 'done')
      })
      .catch((err: any) => {
        if (uploadGens.current[index] !== gen) return
        setSlotState(index, 'error')
        showToast(err?.message ?? 'Upload failed. Tap to retry.', 'error')
      })
    uploadPromises.current.set(index, promise)
  }

  const pickPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showToast('Allow photo access to add photos', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    if (localUris.includes(uri)) {
      showToast('You already added this photo', 'error')
      return
    }

    serverUrls.current[index] = null
    setLocalUris(prev => { const n = [...prev]; n[index] = uri; return n })
    setSlotState(index, 'uploading')
    startUpload(uri, index)
  }

  const retryUpload = (index: number) => {
    const uri = localUris[index]
    if (!uri) return
    serverUrls.current[index] = null
    setSlotState(index, 'uploading')
    startUpload(uri, index)
  }

  const removePhoto = (index: number) => {
    uploadGens.current[index]++
    uploadPromises.current.delete(index)
    serverUrls.current[index] = null
    setLocalUris(prev => { const n = [...prev]; n[index] = null; return n })
    setSlotState(index, 'idle')
  }

  const onSlotPress = (index: number) => {
    if (!localUris[index]) {
      pickPhoto(index)
    } else if (slotStates[index] === 'error') {
      retryUpload(index)
    }
  }

  const handleNext = async () => {
    if (!hasAnyPhoto) return
    setNextLoading(true)
    try {
      await Promise.all([...uploadPromises.current.values()])
      const hasFailed = localUris.some((uri, i) => uri && !serverUrls.current[i])
      if (hasFailed) {
        showToast('Some photos failed — tap the red slots to retry', 'error')
        return
      }
      store.setField('photoUris', serverUrls.current.filter(Boolean) as string[])
      router.push('/(onboarding)/voice')
    } finally {
      setNextLoading(false)
    }
  }

  return {
    localUris,
    slotStates,
    nextLoading,
    hasAnyPhoto,
    toast,
    showToast,
    onSlotPress,
    retryUpload,
    removePhoto,
    handleNext,
  }
}

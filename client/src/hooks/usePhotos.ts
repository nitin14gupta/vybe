import { useState, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { uploadPhoto } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'

export type SlotState = 'idle' | 'uploading' | 'done' | 'error'

export interface PhotoItem {
  id: string
  uri: string | null
  state: SlotState
  serverUrl: string | null
}

export const PHOTO_SLOTS = 6

export function usePhotos() {
  const store = useOnboardingStore()
  const showPill = usePillStore.getState().show

  const [items, setItems] = useState<PhotoItem[]>(() =>
    Array.from({ length: PHOTO_SLOTS }, (_, i) => ({
      id: `photo-${i}`,
      uri: null,
      state: 'idle' as SlotState,
      serverUrl: null,
    }))
  )
  const [nextLoading, setNextLoading] = useState(false)

  const itemsRef = useRef(items)
  itemsRef.current = items

  const uploadGens = useRef<Record<string, number>>({})
  const uploadPromises = useRef<Map<string, Promise<void>>>(new Map())

  // Request permission on enter so the picker opens instantly on first tap
  useEffect(() => {
    ImagePicker.requestMediaLibraryPermissionsAsync()
  }, [])

  const hasAnyPhoto = items.some(item => item.uri)

  const updateItem = (id: string, patch: Partial<PhotoItem>) =>
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))

  const startUpload = (id: string, uri: string, position: number) => {
    const gen = (uploadGens.current[id] = (uploadGens.current[id] ?? 0) + 1)
    const promise = uploadPhoto(uri, position)
      .then(url => {
        if (uploadGens.current[id] !== gen) return
        updateItem(id, { state: 'done', serverUrl: url })
      })
      .catch((err: any) => {
        if (uploadGens.current[id] !== gen) return
        updateItem(id, { state: 'error' })
        showPill(err?.message ?? 'Upload failed. Tap to retry.', 'error')
      })
    uploadPromises.current.set(id, promise)
  }

  const onSlotPress = (id: string) => {
    const current = itemsRef.current
    const idx = current.findIndex(i => i.id === id)
    const item = current[idx]
    if (!item) return
    if (!item.uri) pickPhoto(idx)
    else if (item.state === 'error') retryUpload(id)
  }

  const pickPhoto = async (fromIndex: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showPill('Allow photo access to add photos', 'error')
      return
    }

    const currentItems = itemsRef.current
    const emptyCount = currentItems.slice(fromIndex).filter(i => !i.uri).length
    const selectionLimit = Math.max(1, emptyCount)

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.85,
      allowsMultipleSelection: selectionLimit > 1,
      selectionLimit,
    })
    if (result.canceled || !result.assets.length) return

    const MIN_DIM = 200
    const MIN_BYTES = 50 * 1024
    const validAssets = result.assets.filter(a => {
      if (a.width < MIN_DIM || a.height < MIN_DIM) return false
      if (a.fileSize != null && a.fileSize < MIN_BYTES) return false
      return true
    })
    if (validAssets.length < result.assets.length) {
      showPill('Some photos were too small — choose full-size images', 'error')
    }
    if (!validAssets.length) return

    const latestItems = itemsRef.current
    const existingUris = latestItems.map(i => i.uri)
    const fresh = validAssets.map(a => a.uri).filter(uri => !existingUris.includes(uri))
    if (!fresh.length) return

    const uploads: { id: string; uri: string; position: number }[] = []
    let slot = fromIndex

    for (const uri of fresh) {
      while (slot < PHOTO_SLOTS && latestItems[slot]?.uri) slot++
      if (slot >= PHOTO_SLOTS) break
      const target = latestItems[slot]
      uploads.push({ id: target.id, uri, position: slot })
      slot++
    }
    if (!uploads.length) return

    setItems(prev => {
      const next = [...prev]
      for (const { id, uri } of uploads) {
        const idx = next.findIndex(i => i.id === id)
        if (idx >= 0) {
          uploadGens.current[id] = (uploadGens.current[id] ?? 0) + 1
          next[idx] = { ...next[idx], uri, state: 'uploading', serverUrl: null }
        }
      }
      return next
    })

    for (const { id, uri, position } of uploads) {
      startUpload(id, uri, position)
    }
  }

  const retryUpload = (id: string) => {
    const current = itemsRef.current
    const idx = current.findIndex(i => i.id === id)
    const item = current[idx]
    if (!item?.uri) return
    updateItem(id, { state: 'uploading', serverUrl: null })
    startUpload(id, item.uri, idx)
  }

  const removePhoto = (id: string) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item?.uri) return
    uploadGens.current[id] = (uploadGens.current[id] ?? 0) + 1
    uploadPromises.current.delete(id)
    updateItem(id, { uri: null, state: 'idle', serverUrl: null })
  }

  const handleNext = async () => {
    if (!hasAnyPhoto) return
    setNextLoading(true)
    try {
      await Promise.all([...uploadPromises.current.values()])

      const latestItems = itemsRef.current
      const failedCount = latestItems.filter(i => i.uri && !i.serverUrl).length
      if (failedCount > 0) {
        showPill('Some photos failed — tap the red slots to retry', 'error')
        return
      }

      const urls = latestItems
        .filter((i): i is PhotoItem & { serverUrl: string } => !!i.serverUrl)
        .map(i => i.serverUrl)

      store.setField('photoUris', urls)
      router.push('/(onboarding)/voice')
    } finally {
      setNextLoading(false)
    }
  }

  return {
    items,
    nextLoading,
    hasAnyPhoto,
    onSlotPress,
    retryUpload,
    removePhoto,
    handleNext,
  }
}

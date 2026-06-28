import { useState, useRef } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { uploadPhoto, swapPhotos } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'
import type { GridPositions } from 'react-native-reanimated-dnd'

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

  const uploadGens = useRef<Record<string, number>>({})
  const uploadPromises = useRef<Map<string, Promise<void>>>(new Map())
  // Always-current snapshot for use inside async callbacks
  const itemsRef = useRef(items)
  itemsRef.current = items

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

  const pickPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showPill('Allow photo access to add photos', 'error')
      return
    }

    const currentItems = itemsRef.current
    const emptyFromIndex = currentItems.slice(index).filter(i => !i.uri).length
    const selectionLimit = Math.max(1, emptyFromIndex)

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

    const existingUris = currentItems.map(i => i.uri)
    const fresh = validAssets.map(a => a.uri).filter(uri => !existingUris.includes(uri))
    if (!fresh.length) return

    const uploads: { id: string; uri: string; position: number }[] = []

    setItems(prev => {
      const next = [...prev]
      let slot = index
      for (const uri of fresh) {
        while (slot < PHOTO_SLOTS && next[slot].uri) slot++
        if (slot >= PHOTO_SLOTS) break
        const id = next[slot].id
        uploads.push({ id, uri, position: slot })
        uploadGens.current[id] = (uploadGens.current[id] ?? 0) + 1
        next[slot] = { ...next[slot], uri, state: 'uploading', serverUrl: null }
        slot++
      }
      return next
    })

    for (const { id, uri, position } of uploads) {
      startUpload(id, uri, position)
    }
  }

  const retryUpload = (index: number) => {
    const item = itemsRef.current[index]
    if (!item?.uri) return
    updateItem(item.id, { state: 'uploading', serverUrl: null })
    startUpload(item.id, item.uri, index)
  }

  const removePhoto = (index: number) => {
    const item = itemsRef.current[index]
    if (!item?.uri) return
    uploadGens.current[item.id] = (uploadGens.current[item.id] ?? 0) + 1
    uploadPromises.current.delete(item.id)
    updateItem(item.id, { uri: null, state: 'idle', serverUrl: null })
  }

  const onSlotPress = (index: number) => {
    const item = itemsRef.current[index]
    if (!item) return
    if (!item.uri) {
      pickPhoto(index)
    } else if (item.state === 'error') {
      retryUpload(index)
    }
  }

  const handleDrop = (
    _droppedId: string,
    _position: number,
    allPositions?: GridPositions,
  ) => {
    if (!allPositions) return

    const currentItems = itemsRef.current

    // Build old index map
    const oldIndexOf: Record<string, number> = {}
    currentItems.forEach((item, i) => { oldIndexOf[item.id] = i })

    // Find which items changed position
    type Change = { id: string; oldPos: number; newPos: number }
    const changed: Change[] = []
    for (const [id, pos] of Object.entries(allPositions)) {
      const oldPos = oldIndexOf[id]
      if (oldPos !== undefined && oldPos !== pos.index) {
        changed.push({ id, oldPos, newPos: pos.index })
      }
    }
    if (changed.length === 0) return

    // Build new items order from allPositions
    const idToItem: Record<string, PhotoItem> = {}
    currentItems.forEach(item => { idToItem[item.id] = item })
    const newItems = Object.entries(allPositions)
      .sort(([, a], [, b]) => a.index - b.index)
      .map(([id]) => idToItem[id])
      .filter(Boolean) as PhotoItem[]

    setItems(newItems)

    // Swap strategy produces exactly 2 changed items → one server call
    if (changed.length === 2) {
      const [a, b] = changed
      const itemA = idToItem[a.id]
      const itemB = idToItem[b.id]
      // Only call if at least one has a server-side photo
      if (itemA?.serverUrl || itemB?.serverUrl) {
        swapPhotos(a.oldPos, b.oldPos).catch(() => {
          showPill('Failed to reorder photos', 'error')
          setItems(currentItems)
        })
      }
    }
  }

  const handleNext = async () => {
    if (!hasAnyPhoto) return
    setNextLoading(true)
    try {
      await Promise.all([...uploadPromises.current.values()])
      const filled = itemsRef.current.filter(i => i.uri)
      if (filled.some(i => !i.serverUrl)) {
        showPill('Some photos failed — tap the red slots to retry', 'error')
        return
      }
      store.setField('photoUris', filled.map(i => i.serverUrl!))
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
    handleDrop,
  }
}

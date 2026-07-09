import { useState, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { uploadPhoto } from '@/api/user'
import type { PendingMedia } from '@/hooks/useMediaPicker'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'
import { usePermissionSheetStore } from '@/store/permissionSheetStore'

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
  const showPermissionSheet = usePermissionSheetStore.getState().show

  const [items, setItems] = useState<PhotoItem[]>(() =>
    Array.from({ length: PHOTO_SLOTS }, (_, i) => ({
      id: `photo-${i}`,
      uri: null,
      state: 'idle' as SlotState,
      serverUrl: null,
    }))
  )
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])
  const [nextLoading, setNextLoading] = useState(false)

  const itemsRef = useRef(items)
  itemsRef.current = items

  // Request permission on enter so the picker opens instantly on first tap
  useEffect(() => {
    ImagePicker.requestMediaLibraryPermissionsAsync()
  }, [])

  const hasAnyPhoto = items.some(item => !!item.uri)

  const updateItem = (id: string, patch: Partial<PhotoItem>) =>
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))

  const replaceIndexRef = useRef<number | null>(null)

  const onSlotPress = (id: string) => {
    const current = itemsRef.current
    const idx = current.findIndex(i => i.id === id)
    const item = current[idx]
    if (!item) return
    if (item.uri) {
      replaceIndexRef.current = idx
    } else {
      replaceIndexRef.current = null
    }
    pickPhoto(idx, !!item.uri)
  }

  const pickPhoto = async (fromIndex: number, isReplace: boolean = false) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showPill('Allow photo access to add photos', 'error')
      showPermissionSheet(
        'Photo Permission Required',
        'You need to allow photo access in your device settings to add photos.'
      )
      return
    }

    const currentItems = itemsRef.current
    const emptyCount = currentItems.filter(i => !i.uri).length
    const selectionLimit = isReplace ? 1 : Math.max(1, emptyCount)

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.85,
      allowsMultipleSelection: selectionLimit > 1,
      selectionLimit,
    })

    if (result.canceled || !result.assets.length) {
      replaceIndexRef.current = null
      return
    }

    const validAssets = result.assets
    if (!validAssets.length) return

    const latestItems = itemsRef.current
    const existingUris = latestItems.map(i => i.uri)
    const fresh = validAssets.filter(asset => !existingUris.includes(asset.uri))
    if (!fresh.length) return

    const uploads: PendingMedia[] = fresh.map(asset => ({ 
      uri: asset.uri, 
      type: 'image',
      width: asset.width,
      height: asset.height
    }))
    setPendingMedia(uploads)
  }

  const confirmPendingPhotos = async () => {
    const mediaToKeep = [...pendingMedia]
    setPendingMedia([])
    if (!mediaToKeep.length) {
      replaceIndexRef.current = null
      return
    }

    const currentItems = itemsRef.current

    // Find slots to fill
    const targetIndices: number[] = []

    if (replaceIndexRef.current !== null) {
      targetIndices.push(replaceIndexRef.current)
      replaceIndexRef.current = null
    }

    // Fill remaining from empty slots
    currentItems.forEach((item, idx) => {
      if (!item.uri && !targetIndices.includes(idx)) {
        targetIndices.push(idx)
      }
    })

    mediaToKeep.forEach((media, i) => {
      if (i < targetIndices.length) {
        const targetIdx = targetIndices[i]
        const id = `photo-${targetIdx}`
        updateItem(id, { uri: media.uri, state: 'done', serverUrl: null })
      }
    })
  }

  const cancelPendingPhotos = () => {
    setPendingMedia([])
    replaceIndexRef.current = null
  }
  const removePendingPhoto = (index: number) => {
    setPendingMedia(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) replaceIndexRef.current = null
      return next
    })
  }

  const updatePendingPhoto = (index: number, updated: PendingMedia) => {
    setPendingMedia(prev => {
      const next = [...prev]
      next[index] = updated
      return next
    })
  }

  const removePhoto = (id: string) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item?.uri) return

    setItems(prev => {
      const validPhotos = prev.filter(i => i.id !== id && i.uri !== null)
      return Array.from({ length: PHOTO_SLOTS }, (_, index) => {
        if (index < validPhotos.length) {
          return { ...validPhotos[index], id: `photo-${index}` }
        }
        return {
          id: `photo-${index}`,
          uri: null,
          state: 'idle' as SlotState,
          serverUrl: null,
        }
      })
    })
  }

  const handleNext = async () => {
    if (!hasAnyPhoto) return
    setNextLoading(true)

    try {
      // Mark all slots with a URI as uploading
      setItems(prev => prev.map(item => item.uri ? { ...item, state: 'uploading' } : item))

      const compactedItems = itemsRef.current.filter(i => i.uri !== null)

      const uploads = await Promise.allSettled(
        compactedItems.map((item, index) => uploadPhoto(item.uri!, index))
      )

      let failed = false
      setItems(prev => {
        let uploadIndex = 0
        return prev.map(item => {
          if (!item.uri) return item
          const res = uploads[uploadIndex++]
          if (res.status === 'fulfilled' && res.value !== null) {
            return { ...item, state: 'done', serverUrl: res.value }
          } else if (res.status === 'rejected') {
            failed = true
            return { ...item, state: 'error' }
          }
          return item
        })
      })

      if (failed) {
        showPill('Some photos failed to upload', 'error')
        return
      }

      // All good, navigate
      const urls = uploads
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<string>).value)

      store.setField('photoUris', urls)
      router.push('/(onboarding)/voice')
    } catch (e: any) {
      showPill(e.message || 'Upload failed', 'error')
    } finally {
      setNextLoading(false)
    }
  }

  return {
    items,
    nextLoading,
    hasAnyPhoto,
    onSlotPress,
    retryUpload: () => { }, // No-op now since we do batch upload
    removePhoto,
    handleNext,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  }
}

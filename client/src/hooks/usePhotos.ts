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
export const MIN_PHOTOS = 2

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

  const photoCount = items.filter(item => !!item.uri).length
  const hasMinPhotos = photoCount >= MIN_PHOTOS

  const updateItem = (id: string, patch: Partial<PhotoItem>) =>
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))

  const replaceIndexRef = useRef<number | null>(null)

  // Starts (or restarts) the real upload for a slot. Photos are only cached
  // locally when picked — this fires on "Next" (or a manual retry), not on pick.
  const startUpload = (id: string, uri: string, index: number): Promise<string | null> => {
    updateItem(id, { state: 'uploading' })
    const p = uploadPhoto(uri, index)
      .then(url => {
        // Slot ids get reused when photos are removed/reshuffled — only
        // apply this result if the slot still holds the photo we uploaded.
        if (itemsRef.current.find(i => i.id === id)?.uri === uri) {
          updateItem(id, { state: url ? 'done' : 'error', serverUrl: url ?? null })
        }
        return url ?? null
      })
      .catch(() => {
        if (itemsRef.current.find(i => i.id === id)?.uri === uri) {
          updateItem(id, { state: 'error' })
        }
        return null
      })
    return p
  }

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
        updateItem(id, { uri: media.uri, state: 'idle', serverUrl: null })
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

  const retryUpload = async (id: string) => {
    const currentItems = itemsRef.current
    const index = currentItems.findIndex(i => i.id === id)
    const item = currentItems[index]
    if (!item?.uri || item.state !== 'error') return

    const url = await startUpload(id, item.uri, index)
    if (url) showPill('Photo uploaded', 'default')
    else showPill('Upload failed, try again', 'error')
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
    if (!hasMinPhotos) {
      showPill(`Add at least ${MIN_PHOTOS} photos to continue`, 'error')
      return
    }

    setNextLoading(true)
    try {
      // Photos are only cached locally until now — upload whatever hasn't
      // made it to the server yet (idle from being picked, or a prior error).
      // Use each upload's resolved value directly rather than re-reading
      // itemsRef afterwards — the ref only refreshes on the next render, which
      // isn't guaranteed to have happened yet once the awaits below settle.
      const withUri = itemsRef.current.filter(i => i.uri !== null)
      const results = await Promise.all(
        withUri.map(item => {
          if (item.state === 'done' && item.serverUrl) return Promise.resolve(item.serverUrl)
          const index = itemsRef.current.findIndex(i => i.id === item.id)
          return startUpload(item.id, item.uri!, index)
        })
      )

      if (results.some(url => !url)) {
        showPill('Some photos failed to upload', 'error')
        return
      }

      store.setField('photoUris', results as string[])
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
    hasMinPhotos,
    photoCount,
    onSlotPress,
    retryUpload,
    removePhoto,
    handleNext,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  }
}

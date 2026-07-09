import { useState, useRef, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { getMe, uploadPhoto, deletePhoto, reorderPhotos } from '@/api/user'
import type { PendingMedia } from '@/hooks/useMediaPicker'
import { usePillStore } from '@/store/pillStore'
import { usePermissionSheetStore } from '@/store/permissionSheetStore'
import { hSuccess } from '@/lib/haptics'

export type SlotState = 'idle' | 'uploading' | 'done' | 'error'

export interface PhotoItem {
  id: string
  uri: string | null
  state: SlotState
  serverUrl: string | null
  remoteId?: string
}

export const PHOTO_SLOTS = 6

export function useEditPhotos() {
  const showPill = usePillStore.getState().show
  const showPermissionSheet = usePermissionSheetStore.getState().show

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [items, setItems] = useState<PhotoItem[]>(() =>
    Array.from({ length: PHOTO_SLOTS }, (_, i) => ({
      id: `photo-${i}`,
      uri: null,
      state: 'idle' as SlotState,
      serverUrl: null,
    }))
  )
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])
  const [initialItems, setInitialItems] = useState<PhotoItem[]>([])
  const [deletedRemoteIds, setDeletedRemoteIds] = useState<string[]>([])

  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    ImagePicker.requestMediaLibraryPermissionsAsync()

    // Load existing photos
    getMe().then((profile) => {
      if (profile.photos && profile.photos.length > 0) {
        setItems(prev => {
          const next = [...prev]
          profile.photos.forEach(photo => {
            if (photo.position >= 0 && photo.position < PHOTO_SLOTS) {
              next[photo.position] = {
                id: `photo-${photo.position}`,
                uri: photo.url,
                state: 'done',
                serverUrl: photo.url,
                remoteId: photo.id,
              }
            }
          })
          setInitialItems(next)
          return next
        })
      } else {
        setInitialItems([...itemsRef.current])
      }
    }).catch(() => {
      showPill('Failed to load photos', 'error')
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const updateItem = (id: string, patch: Partial<PhotoItem>) =>
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))

  const onSlotPress = (id: string) => {
    const current = itemsRef.current
    const idx = current.findIndex(i => i.id === id)
    const item = current[idx]
    if (!item) return
    if (!item.uri) pickPhoto(idx)
  }

  const pickPhoto = async (fromIndex: number) => {
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
    const emptyCount = currentItems.slice(fromIndex).filter(i => !i.uri).length
    const selectionLimit = Math.max(1, emptyCount)

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.85,
      allowsMultipleSelection: selectionLimit > 1,
      selectionLimit,
    })
    if (result.canceled || !result.assets.length) return

    const validAssets = result.assets
    if (!validAssets.length) return

    const latestItems = itemsRef.current
    const existingUris = latestItems.map(i => i.uri)
    const fresh = validAssets.map(a => a.uri).filter(uri => !existingUris.includes(uri))
    if (!fresh.length) return

    const uploads: PendingMedia[] = []
    let slot = fromIndex

    for (const uri of fresh) {
      while (slot < PHOTO_SLOTS && latestItems[slot]?.uri) slot++
      if (slot >= PHOTO_SLOTS) break
      uploads.push({ uri, type: 'image' })
      slot++
    }
    if (!uploads.length) return

    setPendingMedia(uploads)
  }

  const confirmPendingPhotos = () => {
    if (!pendingMedia.length) return
    
    setItems(prev => {
      const next = [...prev]
      let pendingIndex = 0
      for (let i = 0; i < next.length; i++) {
        if (!next[i].uri && pendingIndex < pendingMedia.length) {
          next[i] = {
            ...next[i],
            uri: pendingMedia[pendingIndex].uri,
            state: 'idle',
            serverUrl: null,
            remoteId: undefined,
          }
          pendingIndex++
        }
      }
      return next
    })
    setPendingMedia([])
  }

  const cancelPendingPhotos = () => setPendingMedia([])

  const removePendingPhoto = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index))
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

    if (item.remoteId) {
      setDeletedRemoteIds(prev => [...prev, item.remoteId!])
    }

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
          remoteId: undefined,
        }
      })
    })
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // 1. Delete removed photos first
      const deletes = await Promise.allSettled(deletedRemoteIds.map(id => deletePhoto(id)))
      
      const compactedItems = itemsRef.current.filter(i => i.uri !== null)

      // 2. Upload new photos (those with a URI but no remoteId) using their compacted index
      const uploads = await Promise.allSettled(
        compactedItems.map((item, index) => {
          if (!item.remoteId) {
            return uploadPhoto(item.uri!, index)
          }
          return Promise.resolve()
        })
      )

      // 3. Reorder existing photos whose compacted positions changed
      const reorderUpdates = compactedItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.remoteId)
        .map(({ item, index }) => ({ id: item.remoteId!, position: index }))
      
      if (reorderUpdates.length > 0) {
        await reorderPhotos(reorderUpdates)
      }

      const deleteErrors = deletes.filter(r => r.status === 'rejected')
      const uploadErrors = uploads.filter(r => r.status === 'rejected')

      if (deleteErrors.length > 0 || uploadErrors.length > 0) {
        showPill('Some photos failed to sync', 'error')
      } else {
        hSuccess()
      }

      router.back()
    } catch (e: any) {
      showPill(e.message || 'Failed to save changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = deletedRemoteIds.length > 0 || items.some((item, i) => {
    const orig = initialItems[i]
    return item.uri !== orig?.uri
  })

  const validPhotoCount = items.filter(i => !!i.uri).length
  const canSave = hasChanges && validPhotoCount > 0 && !saving

  return {
    loading,
    saving,
    items,
    canSave,
    onSlotPress,
    removePhoto,
    handleSave,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  }
}

import { useState, useCallback, useEffect, useRef } from 'react'
import * as ImagePicker from 'expo-image-picker'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import type { CreateEventForm } from './useCreateEvent'

export type PhotoSlotState = 'idle' | 'uploading' | 'error'

const SLOT_COUNT = 5
const EMPTY_URIS = Array.from({ length: SLOT_COUNT }, () => null as string | null)
const EMPTY_STATES = Array.from({ length: SLOT_COUNT }, () => 'idle' as PhotoSlotState)

export function useEventPhotos(
  coverPhotos: string[],
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void,
) {
  const showPill = usePillStore(s => s.show)
  const [localUris, setLocalUris] = useState<(string | null)[]>(EMPTY_URIS)
  const [slotStates, setSlotStates] = useState<PhotoSlotState[]>(EMPTY_STATES)

  const coverPhotosRef = useRef(coverPhotos)
  coverPhotosRef.current = coverPhotos

  // Sync when edit mode loads existing photos (localUris are all null but coverPhotos has URLs)
  useEffect(() => {
    const hasLocal = localUris.some(Boolean)
    if (!hasLocal && coverPhotos.some(Boolean)) {
      setLocalUris(Array.from({ length: SLOT_COUNT }, (_, i) => coverPhotos[i] ?? null))
    }
  }, [coverPhotos])

  // Display URI: local file takes priority (immediate feedback), falls back to server URL
  const displayUri = useCallback(
    (position: number): string | null => localUris[position] ?? coverPhotos[position] ?? null,
    [localUris, coverPhotos]
  )

  const pickPhoto = useCallback(async (fromIndex: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showPill('Allow photo access to add cover photos', 'error')
      return
    }

    // Tapping an already-filled slot replaces just that photo; an empty slot
    // opens the multi-picker and fills forward from there.
    const isReplacing = !!displayUri(fromIndex)

    let selectionLimit = 1
    if (!isReplacing) {
      let emptyCount = 0
      for (let i = fromIndex; i < SLOT_COUNT; i++) if (!displayUri(i)) emptyCount++
      selectionLimit = Math.max(1, emptyCount)
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.8,
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

    let targets: { position: number; uri: string }[]
    if (isReplacing) {
      targets = [{ position: fromIndex, uri: validAssets[0].uri }]
    } else {
      const existingUris = Array.from({ length: SLOT_COUNT }, (_, i) => displayUri(i))
      const fresh = validAssets.map(a => a.uri).filter(uri => !existingUris.includes(uri))
      if (!fresh.length) return

      targets = []
      let slot = fromIndex
      for (const uri of fresh) {
        while (slot < SLOT_COUNT && displayUri(slot)) slot++
        if (slot >= SLOT_COUNT) break
        targets.push({ position: slot, uri })
        slot++
      }
      if (!targets.length) return
    }

    setLocalUris(prev => {
      const n = [...prev]
      targets.forEach(t => { n[t.position] = t.uri })
      return n
    })

    // Update form state immediately with local URIs
    const currentPhotos = [...coverPhotosRef.current]
    targets.forEach(t => { currentPhotos[t.position] = t.uri })
    coverPhotosRef.current = currentPhotos
    set('coverPhotos', currentPhotos)
  }, [set, displayUri])

  const addPhoto = useCallback((position: number, uri: string) => {
    setLocalUris(prev => { const n = [...prev]; n[position] = uri; return n })

    const photos = [...coverPhotosRef.current]
    photos[position] = uri
    coverPhotosRef.current = photos
    set('coverPhotos', photos)
  }, [set])

  const removePhoto = useCallback((position: number) => {
    setLocalUris(prev => { const n = [...prev]; n[position] = null; return n })
    setSlotStates(prev => { const n = [...prev]; n[position] = 'idle'; return n })
    const photos = [...coverPhotosRef.current]
    photos[position] = ''
    coverPhotosRef.current = photos
    set('coverPhotos', photos)
  }, [set])

  return { localUris, slotStates, pickPhoto, addPhoto, removePhoto, displayUri }
}

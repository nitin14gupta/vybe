import { useState, useCallback, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import type { CreateEventForm } from './useCreateEvent'

export type PhotoSlotState = 'idle' | 'uploading' | 'error'

const EMPTY_URIS = Array.from({ length: 5 }, () => null as string | null)
const EMPTY_STATES = Array.from({ length: 5 }, () => 'idle' as PhotoSlotState)

export function useEventPhotos(
  coverPhotos: string[],
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void,
) {
  const showPill = usePillStore(s => s.show)
  const [localUris, setLocalUris] = useState<(string | null)[]>(EMPTY_URIS)
  const [slotStates, setSlotStates] = useState<PhotoSlotState[]>(EMPTY_STATES)

  // Sync when edit mode loads existing photos (localUris are all null but coverPhotos has URLs)
  useEffect(() => {
    const hasLocal = localUris.some(Boolean)
    if (!hasLocal && coverPhotos.some(Boolean)) {
      setLocalUris(Array.from({ length: 5 }, (_, i) => coverPhotos[i] ?? null))
    }
  }, [coverPhotos])

  const pickPhoto = useCallback(async (position: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showPill('Allow photo access to add cover photos', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (result.canceled) return

    const localUri = result.assets[0].uri

    // Show local preview immediately before upload starts
    setLocalUris(prev => { const n = [...prev]; n[position] = localUri; return n })
    setSlotStates(prev => { const n = [...prev]; n[position] = 'uploading'; return n })

    try {
      const url = await ApiService.uploadEventPhoto(localUri)
      const photos = [...coverPhotos]
      photos[position] = url
      set('coverPhotos', photos)
      setSlotStates(prev => { const n = [...prev]; n[position] = 'idle'; return n })
    } catch (e: any) {
      showPill('Photo upload failed, try again', 'error')
      // Revert local URI on failure so the slot goes back to empty
      setLocalUris(prev => { const n = [...prev]; n[position] = coverPhotos[position] ?? null; return n })
      setSlotStates(prev => { const n = [...prev]; n[position] = 'error'; return n })
    }
  }, [coverPhotos, set, showPill])

  const removePhoto = useCallback((position: number) => {
    setLocalUris(prev => { const n = [...prev]; n[position] = null; return n })
    setSlotStates(prev => { const n = [...prev]; n[position] = 'idle'; return n })
    const photos = [...coverPhotos]
    photos.splice(position, 1)
    set('coverPhotos', photos)
  }, [coverPhotos, set])

  // Display URI: local file takes priority (immediate feedback), falls back to server URL
  const displayUri = (position: number): string | null =>
    localUris[position] ?? coverPhotos[position] ?? null

  return { localUris, slotStates, pickPhoto, removePhoto, displayUri }
}

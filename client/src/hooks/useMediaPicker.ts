import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { usePillStore } from '@/store/pillStore'

export interface PendingMedia {
  uri: string
  type: 'image' | 'video' | 'gif'
  width?: number
  height?: number
}

interface Options {
  onMediaSend: (uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number) => void
}

export function useMediaPicker({ onMediaSend }: Options) {
  const showPill = usePillStore(s => s.show)
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null)

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow camera access to take photos', 'error')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      setPendingMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
      })
    }
  }, [])

  const handleLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow photo access to pick from gallery', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      const isGif = asset.mimeType === 'image/gif' || asset.uri.toLowerCase().endsWith('.gif')
      setPendingMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : isGif ? 'gif' : 'image',
        width: asset.width,
        height: asset.height,
      })
    }
  }, [])

  const confirmSend = useCallback(() => {
    if (!pendingMedia) return
    onMediaSend(pendingMedia.uri, pendingMedia.type, pendingMedia.width, pendingMedia.height)
    setPendingMedia(null)
  }, [pendingMedia, onMediaSend])

  const cancelPreview = useCallback(() => setPendingMedia(null), [])

  return { handleCamera, handleLibrary, pendingMedia, confirmSend, cancelPreview }
}

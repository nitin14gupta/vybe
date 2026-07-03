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

const MAX_SELECTION = 12
const MAX_VIDEO_DURATION_SEC = 60

export function useMediaPicker({ onMediaSend }: Options) {
  const showPill = usePillStore(s => s.show)
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow camera access to take photos', 'error')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      videoMaxDuration: MAX_VIDEO_DURATION_SEC,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      const type = asset.type === 'video' ? 'video' : 'image'
      if (type === 'video' && asset.duration && asset.duration / 1000 > MAX_VIDEO_DURATION_SEC) {
        showPill("That video is longer than 1 min — trim it and try again", 'error')
        return
      }
      setPendingMedia([{
        uri: asset.uri,
        type,
        width: asset.width,
        height: asset.height,
      }])
    }
  }, [showPill])

  const handleLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow photo access to pick from gallery', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SELECTION,
    })
    if (!result.canceled && result.assets.length > 0) {
      const valid: PendingMedia[] = []
      let rejectedVideos = 0
      for (const asset of result.assets) {
        const isGif = asset.mimeType === 'image/gif' || asset.uri.toLowerCase().endsWith('.gif')
        const type = asset.type === 'video' ? 'video' : isGif ? 'gif' : 'image'
        if (type === 'video' && asset.duration && asset.duration / 1000 > MAX_VIDEO_DURATION_SEC) {
          rejectedVideos++
          continue
        }
        valid.push({ uri: asset.uri, type, width: asset.width, height: asset.height })
      }
      if (rejectedVideos > 0) {
        showPill(
          rejectedVideos > 1
            ? `${rejectedVideos} videos are longer than 1 min and were skipped`
            : "That video is longer than 1 min and was skipped",
          'error',
        )
      }
      if (valid.length > 0) setPendingMedia(valid)
    }
  }, [showPill])

  const confirmSend = useCallback(async () => {
    const batch = pendingMedia
    setPendingMedia([])
    for (const item of batch) {
      await onMediaSend(item.uri, item.type, item.width, item.height)
    }
  }, [pendingMedia, onMediaSend])

  const removeFromPreview = useCallback((index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index))
  }, [])

  const cancelPreview = useCallback(() => setPendingMedia([]), [])

  return { handleCamera, handleLibrary, pendingMedia, confirmSend, cancelPreview, removeFromPreview }
}

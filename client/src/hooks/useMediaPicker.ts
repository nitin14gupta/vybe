import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

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
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null)

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.')
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
      Alert.alert('Permission needed', 'Photo library access is required.')
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

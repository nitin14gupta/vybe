import { useState, useCallback } from 'react'
import type { MediaViewType } from '@/components/chat/MediaViewerModal'

interface ViewingMedia {
  url: string
  type: MediaViewType
}

export function useImageViewer() {
  const [viewingMedia, setViewingMedia] = useState<ViewingMedia | null>(null)

  const openMedia = useCallback((url: string, type: MediaViewType = 'image') => {
    setViewingMedia({ url, type })
  }, [])

  const closeMedia = useCallback(() => {
    setViewingMedia(null)
  }, [])

  return { viewingMedia, openMedia, closeMedia }
}

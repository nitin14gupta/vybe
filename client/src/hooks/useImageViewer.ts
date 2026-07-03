import { useState, useCallback } from 'react'
import type { MediaViewerItem } from '@/components/chat/MediaViewerModal'

interface ViewingMedia {
  items: MediaViewerItem[]
  initialIndex: number
}

export function useImageViewer() {
  const [viewingMedia, setViewingMedia] = useState<ViewingMedia | null>(null)

  const openMedia = useCallback((items: MediaViewerItem[], initialIndex = 0) => {
    if (items.length === 0) return
    setViewingMedia({ items, initialIndex })
  }, [])

  const closeMedia = useCallback(() => {
    setViewingMedia(null)
  }, [])

  return { viewingMedia, openMedia, closeMedia }
}

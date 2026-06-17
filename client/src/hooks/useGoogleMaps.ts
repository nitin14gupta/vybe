import { useRef, useState } from 'react'
import type { FlatList } from 'react-native'
import type MapView from 'react-native-maps'
import type { EventSummary } from '@/api/apiService'

export function useGoogleMaps() {
  const mapRef = useRef<MapView>(null)
  const previewListRef = useRef<FlatList>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const handleMarkerPress = (ev: EventSummary, idx: number) => {
    setActiveEventId(ev.id)
    previewListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 })
  }

  return { mapRef, previewListRef, activeEventId, setActiveEventId, handleMarkerPress }
}

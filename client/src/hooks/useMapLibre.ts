import { useMemo, useRef, useState } from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import type { FeatureCollection } from 'geojson'
import type { EventSummary } from '@/api/apiService'
import type { MapBounds } from '@/constants'

// Initialize MapLibre once — OpenFreeMap needs no access token.
MapLibreGL.setAccessToken(null)

export function useMapLibre(onBoundsChange?: (bounds: MapBounds) => void) {
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const flyTo = (lat: number, lng: number, zoom = 12) => {
    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: zoom,
      animationDuration: 400,
      animationMode: 'flyTo',
    })
  }

  // Called when the user stops panning/zooming.
  // feature.geometry.coordinates = [lng, lat] (center)
  // feature.properties.visibleBounds = [[maxLng, maxLat], [minLng, minLat]]
  const handleRegionDidChange = (feature: GeoJSON.Feature) => {
    if (!onBoundsChange) return
    if (!feature.properties?.isUserInteraction) return
    const b = feature.properties?.visibleBounds as [[number, number], [number, number]] | undefined
    if (!b) return
    onBoundsChange({
      minLat: b[1][1],
      maxLat: b[0][1],
      minLng: b[1][0],
      maxLng: b[0][0],
    })
  }

  const handleFeaturePress = (e: { features?: GeoJSON.Feature[] }) => {
    const id = e.features?.[0]?.properties?.id as string | undefined
    setActiveEventId(id ?? null)
  }

  return { cameraRef, activeEventId, setActiveEventId, flyTo, handleRegionDidChange, handleFeaturePress }
}

// Converts EventSummary[] to a GeoJSON FeatureCollection for MapLibre ShapeSource.
// Keep outside the hook so screens can memoize it with useMemo independently.
export function eventsToGeoJSON(events: EventSummary[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events
      .filter(e => e.location_lat != null && e.location_lng != null)
      .map(e => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.location_lng!, e.location_lat!],
        },
        properties: {
          id: e.id,
          event_type: e.event_type,
          title: e.title,
          is_free: e.is_free,
        },
      })),
  }
}

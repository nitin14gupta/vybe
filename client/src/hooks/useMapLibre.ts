import { useRef, useState } from 'react'
import type { MapRef, ViewStateChangeEvent } from '@maplibre/maplibre-react-native'
import type { NativeSyntheticEvent } from 'react-native'
import type { FeatureCollection } from 'geojson'
import type { EventSummary } from '@/api/apiService'
import type { MapBounds } from '@/constants'

// v11 uses named exports only — no default MapLibreGL object, no setAccessToken needed.

const DEFAULT_ZOOM = 11

export function useMapLibre(onBoundsChange?: (bounds: MapBounds) => void) {
  const mapRef = useRef<MapRef>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  const handleRegionIsChanging = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { zoom: nextZoom } = event.nativeEvent
    if (typeof nextZoom === 'number') setZoom(nextZoom)
  }

  const handleRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { userInteraction, bounds, zoom: nextZoom } = event.nativeEvent
    if (typeof nextZoom === 'number') setZoom(nextZoom)
    if (!onBoundsChange || !userInteraction || !bounds) return
    // LngLatBounds = [west, south, east, north]
    onBoundsChange({
      minLng: bounds[0],
      minLat: bounds[1],
      maxLng: bounds[2],
      maxLat: bounds[3],
    })
  }

  return { mapRef, activeEventId, setActiveEventId, zoom, handleRegionIsChanging, handleRegionDidChange }
}

// Converts EventSummary[] to a GeoJSON FeatureCollection for MapLibre GeoJSONSource.
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

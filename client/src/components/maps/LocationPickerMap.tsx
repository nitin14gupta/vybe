import React from 'react'
import { StyleSheet } from 'react-native'
import MapView from 'react-native-maps'
import type { Region } from 'react-native-maps'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER } from '@/constants/mapConfig'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
]

export interface LocationPickerMapProps {
  lat?: number
  lng?: number
  provider?: 'maplibre' | 'google'
  onChange: (lat: number, lng: number) => void
}

export function LocationPickerMap({
  lat,
  lng,
  provider = MAP_PROVIDER,
  onChange,
}: LocationPickerMapProps) {
  if (provider === 'google') {
    return (
      <MapView
        style={StyleSheet.absoluteFillObject}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: lat ?? DEFAULT_MAP_CENTER.lat,
          longitude: lng ?? DEFAULT_MAP_CENTER.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        onRegionChangeComplete={(region: Region) => {
          onChange(region.latitude, region.longitude)
        }}
      />
    )
  }

  return (
    <MapLibreGL.MapView
      style={StyleSheet.absoluteFillObject}
      styleURL={TILE_STYLE.dark}
      onRegionDidChange={(feature: GeoJSON.Feature) => {
        if (!feature.properties?.isUserInteraction) return
        const [fLng, fLat] = (feature.geometry as GeoJSON.Point).coordinates
        onChange(fLat, fLng)
      }}
      logoEnabled={false}
      attributionEnabled={false}
    >
      <MapLibreGL.Camera
        defaultSettings={{
          centerCoordinate: [lng ?? DEFAULT_MAP_CENTER.lng, lat ?? DEFAULT_MAP_CENTER.lat],
          zoomLevel: 14,
        }}
      />
    </MapLibreGL.MapView>
  )
}

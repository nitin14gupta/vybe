import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker as GoogleMarker } from 'react-native-maps'
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native'
import { Colors } from '@/constants'
import { MAP_PROVIDER, TILE_STYLE } from '@/constants/mapConfig'

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
]

export interface StaticEventMapProps {
  lat: number
  lng: number
  eventType?: string
  provider?: 'maplibre' | 'google'
}

export function StaticEventMap({
  lat,
  lng,
  eventType = 'other',
  provider = MAP_PROVIDER,
}: StaticEventMapProps) {
  const emoji = EVENT_EMOJIS[eventType] ?? '📍'

  if (provider === 'google') {
    return (
      <MapView
        style={StyleSheet.absoluteFillObject}
        customMapStyle={DARK_MAP_STYLE}
        region={{ latitude: lat, longitude: lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
      >
        <GoogleMarker coordinate={{ latitude: lat, longitude: lng }}>
          <View style={s.pin}>
            <Text style={{ fontSize: 18 }}>{emoji}</Text>
          </View>
        </GoogleMarker>
      </MapView>
    )
  }

  return (
    <Map
      style={StyleSheet.absoluteFillObject}
      mapStyle={TILE_STYLE.dark}
      dragPan={false}
      touchZoom={false}
      touchRotate={false}
      touchPitch={false}
      logo={false}
      attribution={false}
    >
      <Camera initialViewState={{ center: [lng, lat], zoom: 14 }} />
      {/* Marker.lngLat = [longitude, latitude] */}
      <Marker lngLat={[lng, lat]}>
        <View style={s.pin}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
      </Marker>
    </Map>
  )
}

const s = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

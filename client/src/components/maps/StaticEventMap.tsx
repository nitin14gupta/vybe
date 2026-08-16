import React from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Marker as GoogleMarker } from 'react-native-maps'
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native'
import { MapPin as MapPinIcon } from 'lucide-react-native'
import { Colors, EVENT_ICONS } from '@/constants'
import { MAP_PROVIDER, TILE_STYLE } from '@/constants/mapConfig'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: Colors.surface }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: Colors.background }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: Colors.deepBackground }] },
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
  const TypeIcon = EVENT_ICONS[eventType] ?? MapPinIcon

  if (provider === 'google') {
    return (
      <MapView
        style={StyleSheet.absoluteFill}
        customMapStyle={DARK_MAP_STYLE}
        region={{ latitude: lat, longitude: lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
      >
        <GoogleMarker coordinate={{ latitude: lat, longitude: lng }} tracksViewChanges={false}>
          <View style={s.pin}>
            <TypeIcon size={16} color={Colors.brandOrange} strokeWidth={2} />
          </View>
        </GoogleMarker>
      </MapView>
    )
  }

  return (
    <Map
      style={StyleSheet.absoluteFill}
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
          <TypeIcon size={16} color={Colors.brandOrange} strokeWidth={2} />
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

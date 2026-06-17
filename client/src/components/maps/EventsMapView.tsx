import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { Colors } from '@/constants'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER, type MapBounds } from '@/constants/mapConfig'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapLibre, eventsToGeoJSON } from '@/hooks/useMapLibre'
import type { EventSummary } from '@/api/apiService'
import type { ViewStyle } from 'react-native'

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
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
]

// ── Google Maps implementation ────────────────────────────────────────────────

interface GoogleProps {
  events: EventSummary[]
  userLat?: number
  userLng?: number
  activeEventId: string | null
  onEventSelect: (ev: EventSummary, idx: number) => void
}

function EventsMapGoogle({ events, userLat, userLng, activeEventId, onEventSelect }: GoogleProps) {
  const { mapRef } = useGoogleMaps()

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: userLat ?? DEFAULT_MAP_CENTER.lat,
        longitude: userLng ?? DEFAULT_MAP_CENTER.lng,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }}
      customMapStyle={DARK_MAP_STYLE}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {events.map((ev, idx) =>
        ev.location_lat != null && ev.location_lng != null ? (
          <Marker
            key={ev.id}
            coordinate={{ latitude: ev.location_lat, longitude: ev.location_lng }}
            onPress={() => onEventSelect(ev, idx)}
          >
            <View style={[s.pin, ev.id === activeEventId && s.pinActive]}>
              <Text style={s.pinEmoji}>{EVENT_EMOJIS[ev.event_type] ?? '🔥'}</Text>
            </View>
          </Marker>
        ) : null,
      )}
    </MapView>
  )
}

// ── MapLibre implementation ───────────────────────────────────────────────────

interface LibreProps {
  events: EventSummary[]
  userLat?: number
  userLng?: number
  activeEventId: string | null
  onEventSelect: (ev: EventSummary, idx: number) => void
  onBoundsChange?: (bounds: MapBounds) => void
}

function EventsMapLibre({ events, userLat, userLng, activeEventId, onEventSelect, onBoundsChange }: LibreProps) {
  const { cameraRef, handleRegionDidChange, handleFeaturePress: _handleFeaturePress } = useMapLibre(onBoundsChange)
  const geojson = useMemo(() => eventsToGeoJSON(events), [events])

  const handleFeaturePress = (e: any) => {
    const feature = e.features?.[0]
    if (!feature) return
    const id = feature.properties?.id as string
    const idx = events.findIndex(ev => ev.id === id)
    const ev = events.find(ev => ev.id === id)
    if (ev && idx >= 0) onEventSelect(ev, idx)
  }

  const circleLayerStyle = {
    circleRadius: 20,
    circleColor: [
      'case',
      ['==', ['get', 'id'], activeEventId ?? ''],
      Colors.brandCoral,
      Colors.brandOrange,
    ],
    circleStrokeWidth: 2,
    circleStrokeColor: '#fff',
    circleOpacity: 0.95,
  }

  return (
    <MapLibreGL.MapView
      style={StyleSheet.absoluteFillObject}
      styleURL={TILE_STYLE.dark}
      onRegionDidChange={handleRegionDidChange}
      logoEnabled={false}
      attributionEnabled={false}
    >
      <MapLibreGL.Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: [userLng ?? DEFAULT_MAP_CENTER.lng, userLat ?? DEFAULT_MAP_CENTER.lat],
          zoomLevel: 11,
        }}
      />
      <MapLibreGL.UserLocation visible />
      <MapLibreGL.ShapeSource id="events-source" shape={geojson} onPress={handleFeaturePress}>
        <MapLibreGL.CircleLayer id="events-circles" style={circleLayerStyle} />
      </MapLibreGL.ShapeSource>
    </MapLibreGL.MapView>
  )
}

// ── Public component (reads MAP_PROVIDER, accepts optional override) ──────────

export interface EventsMapViewProps {
  events: EventSummary[]
  userLat?: number
  userLng?: number
  activeEventId: string | null
  provider?: 'maplibre' | 'google'
  onEventSelect: (ev: EventSummary, idx: number) => void
  onBoundsChange?: (bounds: MapBounds) => void
  style?: ViewStyle
}

export function EventsMapView({
  events,
  userLat,
  userLng,
  activeEventId,
  provider = MAP_PROVIDER,
  onEventSelect,
  onBoundsChange,
  style,
}: EventsMapViewProps) {
  return (
    <View style={[StyleSheet.absoluteFillObject, style]}>
      {provider === 'google' ? (
        <EventsMapGoogle
          events={events}
          userLat={userLat}
          userLng={userLng}
          activeEventId={activeEventId}
          onEventSelect={onEventSelect}
        />
      ) : (
        <EventsMapLibre
          events={events}
          userLat={userLat}
          userLng={userLng}
          activeEventId={activeEventId}
          onEventSelect={onEventSelect}
          onBoundsChange={onBoundsChange}
        />
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinActive: {
    borderColor: Colors.brandCoral,
    backgroundColor: 'rgba(255,56,100,0.15)',
    transform: [{ scale: 1.15 }],
  },
  pinEmoji: { fontSize: 20 },
})

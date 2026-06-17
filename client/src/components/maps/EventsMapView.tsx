import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import {
  Map,
  Camera,
  UserLocation,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native'
import type { NativeSyntheticEvent } from 'react-native'
import type { PressEventWithFeatures } from '@maplibre/maplibre-react-native'
import { Colors } from '@/constants'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER, type MapBounds } from '@/constants/mapConfig'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapLibre, eventsToGeoJSON } from '@/hooks/useMapLibre'
import type { EventSummary } from '@/api/apiService'
import type { ViewStyle } from 'react-native'
import type { FeatureCollection } from 'geojson'

function routeLineGeoJSON(
  userLat: number, userLng: number,
  eventLat: number, eventLng: number,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[userLng, userLat], [eventLng, eventLat]] },
      properties: {},
    }],
  }
}

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
  const activeEvent = activeEventId ? events.find(e => e.id === activeEventId) : null

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
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
      {/* Route line from user → selected event */}
      {activeEvent && userLat != null && userLng != null &&
        activeEvent.location_lat != null && activeEvent.location_lng != null && (
        <Polyline
          coordinates={[
            { latitude: userLat, longitude: userLng },
            { latitude: activeEvent.location_lat, longitude: activeEvent.location_lng },
          ]}
          strokeColor={Colors.brandCoral}
          strokeWidth={2.5}
          lineDashPattern={[8, 5]}
        />
      )}
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
  const { mapRef, handleRegionDidChange } = useMapLibre(onBoundsChange)
  const geojson = useMemo(() => eventsToGeoJSON(events), [events])

  const activeEvent = useMemo(
    () => (activeEventId ? events.find(e => e.id === activeEventId) : null),
    [activeEventId, events],
  )

  const routeLine = useMemo((): FeatureCollection | null => {
    if (!activeEvent || userLat == null || userLng == null) return null
    if (activeEvent.location_lat == null || activeEvent.location_lng == null) return null
    return routeLineGeoJSON(userLat, userLng, activeEvent.location_lat, activeEvent.location_lng)
  }, [activeEvent, userLat, userLng])

  const handleSourcePress = (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
    const feature = event.nativeEvent.features?.[0]
    if (!feature) return
    const id = feature.properties?.id as string
    const idx = events.findIndex(ev => ev.id === id)
    if (idx >= 0) onEventSelect(events[idx], idx)
  }

  const circlePaint = {
    'circle-radius': 20,
    'circle-color': [
      'case',
      ['==', ['get', 'id'], activeEventId ?? ''],
      Colors.brandCoral,
      Colors.brandOrange,
    ] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
    'circle-opacity': 0.95,
  }

  const linePaint = {
    'line-color': Colors.brandCoral,
    'line-width': 2.5,
    'line-dasharray': [6, 4],
    'line-opacity': 0.9,
  }

  return (
    <Map
      ref={mapRef}
      style={{ flex: 1 }}
      mapStyle={TILE_STYLE.dark}
      onRegionDidChange={handleRegionDidChange}
    >
      <Camera
        initialViewState={{
          center: [userLng ?? DEFAULT_MAP_CENTER.lng, userLat ?? DEFAULT_MAP_CENTER.lat],
          zoom: 11,
        }}
      />
      <UserLocation visible />

      {/* Dashed route line from user → selected event */}
      {routeLine && (
        <GeoJSONSource id="route-source" data={routeLine}>
          <Layer id="route-line" type="line" source="route-source" paint={linePaint} />
        </GeoJSONSource>
      )}

      <GeoJSONSource id="events-source" data={geojson} onPress={handleSourcePress}>
        <Layer
          id="events-circles"
          type="circle"
          source="events-source"
          paint={circlePaint}
        />
      </GeoJSONSource>
    </Map>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

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
    <View style={[{ flex: 1 }, style]}>
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

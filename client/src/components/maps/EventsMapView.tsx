import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import Svg, { Defs, RadialGradient, Stop, Path } from 'react-native-svg'
import {
  Map,
  Camera,
  UserLocation,
  Marker as LibreMarker,
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
  userHeading?: number
  activeEventId: string | null
  onEventSelect: (ev: EventSummary, idx: number) => void
}

function EventsMapGoogle({ events, userLat, userLng, userHeading, activeEventId, onEventSelect }: GoogleProps) {
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
      {/* Direction cone — shows which way the device is facing */}
      {userLat != null && userLng != null && userHeading != null && (
        <Marker
          coordinate={{ latitude: userLat, longitude: userLng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges
        >
          <HeadingCone heading={userHeading} />
        </Marker>
      )}

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
            anchor={{ x: 0.5, y: 1 }}
          >
            <EventMapPin event={ev} active={ev.id === activeEventId} />
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
  userHeading?: number
  activeEventId: string | null
  onEventSelect: (ev: EventSummary, idx: number) => void
  onBoundsChange?: (bounds: MapBounds) => void
}

function EventsMapLibre({ events, userLat, userLng, userHeading, activeEventId, onEventSelect, onBoundsChange }: LibreProps) {
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

  // Heatmap — multi-color spectrum teal→blue→purple→red→orange
  const heatmapPaint = {
    'heatmap-weight': 1,
    'heatmap-radius': 60,
    'heatmap-intensity': 1.5,
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0,    'rgba(0,0,0,0)',
      0.15, 'rgba(29,233,182,0.25)',
      0.35, 'rgba(79,195,247,0.55)',
      0.60, 'rgba(206,147,216,0.75)',
      0.82, 'rgba(255,82,82,0.85)',
      1.0,  'rgba(255,107,53,0.95)',
    ] as any,
    'heatmap-opacity': 0.85,
  }

  const circlePaint = {
    'circle-radius': [
      'case',
      ['==', ['get', 'id'], activeEventId ?? ''],
      14,
      11,
    ] as any,
    'circle-color': [
      'case',
      ['==', ['get', 'id'], activeEventId ?? ''],
      Colors.brandCoral,
      Colors.brandOrange,
    ] as any,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#fff',
    'circle-opacity': 1,
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
      logo={false}
      attribution={false}
    >
      <Camera
        initialViewState={{
          center: [userLng ?? DEFAULT_MAP_CENTER.lng, userLat ?? DEFAULT_MAP_CENTER.lat],
          zoom: 11,
        }}
      />
      <UserLocation visible/>

      {/* Direction cone — custom overlay driven by device compass, avoids the
          native UserLocation "heading" pipeline which crashes under RN's New
          Architecture (__next_prime overflow in MLRNLocationModule) */}
      {userLat != null && userLng != null && userHeading != null && (
        <LibreMarker lngLat={[userLng, userLat]} anchor="center">
          <HeadingCone heading={userHeading} />
        </LibreMarker>
      )}

      {/* Dashed route line from user → selected event */}
      {routeLine && (
        <GeoJSONSource id="route-source" data={routeLine}>
          <Layer id="route-line" type="line" source="route-source" paint={linePaint} />
        </GeoJSONSource>
      )}

      {/* Heatmap glow layer — same data, separate source so no press fires on the glow */}
      <GeoJSONSource id="events-heat-source" data={geojson}>
        <Layer id="events-heatmap" type="heatmap" source="events-heat-source" paint={heatmapPaint} />
      </GeoJSONSource>

      {/* Tappable pin circles — press fires onEventSelect */}
      <GeoJSONSource id="events-source" data={geojson} onPress={handleSourcePress}>
        <Layer id="events-circles" type="circle" source="events-source" paint={circlePaint} />
      </GeoJSONSource>
    </Map>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export interface EventsMapViewProps {
  events: EventSummary[]
  userLat?: number
  userLng?: number
  userHeading?: number
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
  userHeading,
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
          userHeading={userHeading}
          activeEventId={activeEventId}
          onEventSelect={onEventSelect}
        />
      ) : (
        <EventsMapLibre
          events={events}
          userLat={userLat}
          userLng={userLng}
          userHeading={userHeading}
          activeEventId={activeEventId}
          onEventSelect={onEventSelect}
          onBoundsChange={onBoundsChange}
        />
      )}
    </View>
  )
}

// Soft "flashlight beam" pointing toward device heading — apex sits at the
// coordinate anchor, a feathered radial-gradient fan spreads out in the
// facing direction (no hard edges, fades to nothing at the rim). Rotated
// around its own apex by nesting inside a wrapper twice the beam's radius
// tall, so the apex lands at the wrapper's geometric center (RN rotates
// around a view's center by default).
const CONE_RADIUS = 60
const CONE_ANGLE = 70 // degrees, full spread
const CONE_VB_W = 90
const CONE_HALF_RAD = (CONE_ANGLE / 2) * (Math.PI / 180)
const CONE_APEX = { x: CONE_VB_W / 2, y: CONE_RADIUS }
const CONE_LEFT = {
  x: CONE_APEX.x - CONE_RADIUS * Math.sin(CONE_HALF_RAD),
  y: CONE_APEX.y - CONE_RADIUS * Math.cos(CONE_HALF_RAD),
}
const CONE_RIGHT = {
  x: CONE_APEX.x + CONE_RADIUS * Math.sin(CONE_HALF_RAD),
  y: CONE_LEFT.y,
}
const CONE_PATH = `M ${CONE_APEX.x} ${CONE_APEX.y} L ${CONE_LEFT.x} ${CONE_LEFT.y} A ${CONE_RADIUS} ${CONE_RADIUS} 0 0 1 ${CONE_RIGHT.x} ${CONE_RIGHT.y} Z`

function HeadingCone({ heading }: { heading: number }) {
  return (
    <View style={[c.wrap, { transform: [{ rotate: `${heading}deg` }] }]}>
      <Svg width={CONE_VB_W} height={CONE_RADIUS} viewBox={`0 0 ${CONE_VB_W} ${CONE_RADIUS}`}>
        <Defs>
          <RadialGradient
            id="beam"
            cx={CONE_APEX.x}
            cy={CONE_APEX.y}
            r={CONE_RADIUS}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#9fc4ff" stopOpacity={0.5} />
            <Stop offset="0.45" stopColor="#9fc4ff" stopOpacity={0.28} />
            <Stop offset="0.8" stopColor="#9fc4ff" stopOpacity={0.1} />
            <Stop offset="1" stopColor="#9fc4ff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={CONE_PATH} fill="url(#beam)" />
      </Svg>
    </View>
  )
}

const c = StyleSheet.create({
  wrap: {
    // Wrapper is 2x the beam's height so its geometric center — which is
    // where RN applies rotation, and where the map anchor is set — lines
    // up with the beam's apex (the svg's bottom edge, sitting flush against
    // the wrapper's midline).
    width: CONE_VB_W,
    height: CONE_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
})

function EventMapPin({ event, active }: { event: EventSummary; active: boolean }) {
  const emoji = EVENT_EMOJIS[event.event_type] ?? '🔥'
  return (
    <View style={p.wrap}>
      <View style={[p.bubble, active && p.bubbleActive]}>
        <Text style={p.emoji}>{emoji}</Text>
      </View>
      <View style={[p.tail, active && p.tailActive]} />
    </View>
  )
}

const p = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 2.5,
    borderColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  bubbleActive: {
    backgroundColor: 'rgba(255,107,53,0.18)',
    borderColor: Colors.brandCoral,
    transform: [{ scale: 1.15 }],
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.brandOrange,
    marginTop: -1,
  },
  tailActive: { borderTopColor: Colors.brandCoral },
  emoji: { fontSize: 20 },
})

const s = StyleSheet.create({})

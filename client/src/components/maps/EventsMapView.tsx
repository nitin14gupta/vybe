import React, { useMemo, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import MapView, { Marker } from 'react-native-maps'
import Svg, { Defs, RadialGradient, Stop, Path } from 'react-native-svg'
import {
  Map,
  Camera,
  UserLocation,
  Marker as LibreMarker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native'
import { Colors, EVENT_ICONS, EVENT_ICON_FALLBACK } from '@/constants'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER, type MapBounds } from '@/constants/mapConfig'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapLibre, eventsToGeoJSON } from '@/hooks/useMapLibre'
import type { EventSummary } from '@/api/apiService'
import type { ViewStyle } from 'react-native'

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

      {events.map((ev, idx) =>
        ev.location_lat != null && ev.location_lng != null ? (
          <Marker
            key={ev.id}
            coordinate={{ latitude: ev.location_lat, longitude: ev.location_lng }}
            onPress={() => onEventSelect(ev, idx)}
            anchor={{ x: 0.5, y: 0.5 }}
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

  // Heatmap — soft ambient glow beneath the pins, toned down now that pins
  // carry the event photo and no longer need the circle layer for legibility.
  const heatmapPaint = {
    'heatmap-weight': 1,
    'heatmap-radius': 46,
    'heatmap-intensity': 1.1,
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.15, 'rgba(29,233,182,0.18)',
      0.35, 'rgba(79,195,247,0.35)',
      0.60, 'rgba(206,147,216,0.5)',
      0.82, 'rgba(255,82,82,0.55)',
      1.0, 'rgba(255,107,53,0.6)',
    ] as any,
    'heatmap-opacity': 0.7,
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
      {userLat != null && userLng != null && (
        <LibreMarker lngLat={[userLng, userLat]} anchor="center">
          <View>
            {userHeading != null && <HeadingCone heading={userHeading} />}
            <PulsatingDot />
          </View>
        </LibreMarker>
      )}

      {/* Heatmap glow layer — ambient warmth under the pins */}
      <GeoJSONSource id="events-heat-source" data={geojson}>
        <Layer id="events-heatmap" type="heatmap" source="events-heat-source" paint={heatmapPaint} />
      </GeoJSONSource>

      {/* Photo pins — one real marker per event, centered on the coordinate */}
      {events.map((ev, idx) =>
        ev.location_lat != null && ev.location_lng != null ? (
          <LibreMarker
            key={ev.id}
            id={ev.id}
            lngLat={[ev.location_lng, ev.location_lat]}
            anchor="center"
            onPress={() => onEventSelect(ev, idx)}
          >
            <EventMapPin event={ev} active={ev.id === activeEventId} />
          </LibreMarker>
        ) : null,
      )}
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

function PulsatingDot() {
  const anim = useSharedValue(0)

  useEffect(() => {
    anim.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    )
  }, [])

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + anim.value * 2.5 }],
      opacity: 1 - anim.value,
    }
  })

  return (
    <>
      <Animated.View style={[c.pulseRing, rStyle]} />
      <View style={c.userDot} />
    </>
  )
}

const c = StyleSheet.create({
  userDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 2.5,
    borderColor: '#fff',
    marginTop: -8,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  pulseRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.4)',
    marginTop: -16,
    marginLeft: -16,
  },
  wrap: {
    width: CONE_VB_W,
    height: CONE_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
})

// Event marker — just the event's own 16:9 photo, centered on the coordinate.
function EventMapPin({ event, active }: { event: EventSummary; active: boolean }) {
  const cover = event.cover_photos?.[0]?.url
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
  return (
    <View style={p.wrap}>
      <View style={[p.bubble, active && p.bubbleActive]}>
        {cover ? (
          <Image source={{ uri: cover }} style={p.photo} contentFit="cover" />
        ) : (
          <View style={[p.photo, p.photoFallback]}>
            <TypeIcon size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
      </View>
    </View>
  )
}

const PIN_W = 72
const PIN_H = Math.round((PIN_W * 9) / 16)
const PIN_RADIUS = 10

const p = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bubble: {
    width: PIN_W,
    height: PIN_H,
    borderRadius: PIN_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  bubbleActive: {
    transform: [{ scale: 1.12 }],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const s = StyleSheet.create({})

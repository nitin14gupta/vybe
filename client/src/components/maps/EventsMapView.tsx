import React, { useMemo, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import MapView, { Marker, type Region } from 'react-native-maps'
import Svg, { Defs, RadialGradient, Stop, Path } from 'react-native-svg'
import {
  Map,
  Camera,
  UserLocation,
  Marker as LibreMarker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native'
import { Colors, EVENT_ICONS, EVENT_ICON_FALLBACK, withOpacity } from '@/constants'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER, type MapBounds } from '@/constants/mapConfig'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapLibre, eventsToGeoJSON } from '@/hooks/useMapLibre'
import type { EventSummary } from '@/api/apiService'
import type { ViewStyle } from 'react-native'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: Colors.surface }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: Colors.background }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: Colors.deepBackground }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
]

// Heatmap paint spec is static (no prop/state dependencies) — hoisted out of
// the component so it isn't reallocated on every render (zoom changes etc.).
const HEATMAP_PAINT = {
  'heatmap-weight': 1,
  'heatmap-radius': 46,
  'heatmap-intensity': 1.1,
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0, withOpacity(Colors.black, 0),
    0.15, 'rgba(29,233,182,0.18)',
    0.35, 'rgba(79,195,247,0.35)',
    0.60, 'rgba(206,147,216,0.5)',
    0.82, 'rgba(255,82,82,0.55)',
    1.0, withOpacity(Colors.brandOrange, 0.6),
  ] as any,
  'heatmap-opacity': 0.7,
}

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
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const pinScale = pinScaleForZoom(zoom)

  // Filtering is only redone when the underlying event list changes, not on
  // every zoom/selection re-render — index is preserved so it still lines up
  // with the caller's own `events` array (used e.g. to scroll a preview list).
  const markerEvents = useMemo(
    () =>
      events
        .map((ev, idx) => ({ ev, idx }))
        .filter(({ ev }) => ev.location_lat != null && ev.location_lng != null),
    [events],
  )

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
      onRegionChange={(region: Region) => setZoom(zoomFromLongitudeDelta(region.longitudeDelta))}
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

      {markerEvents.map(({ ev, idx }) => (
        <Marker
          key={ev.id}
          coordinate={{ latitude: ev.location_lat as number, longitude: ev.location_lng as number }}
          onPress={() => onEventSelect(ev, idx)}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <EventMapPin event={ev} active={ev.id === activeEventId} scale={pinScale} />
        </Marker>
      ))}
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
  const { mapRef, handleRegionIsChanging, handleRegionDidChange, zoom } = useMapLibre(onBoundsChange)
  const geojson = useMemo(() => eventsToGeoJSON(events), [events])
  const pinScale = pinScaleForZoom(zoom)

  // Filtering is only redone when the underlying event list changes, not on
  // every zoom/selection re-render — index is preserved so it still lines up
  // with the caller's own `events` array (used e.g. to scroll a preview list).
  const markerEvents = useMemo(
    () =>
      events
        .map((ev, idx) => ({ ev, idx }))
        .filter(({ ev }) => ev.location_lat != null && ev.location_lng != null),
    [events],
  )

  return (
    <Map
      ref={mapRef}
      style={{ flex: 1 }}
      mapStyle={TILE_STYLE.dark}
      onRegionIsChanging={handleRegionIsChanging}
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
        <Layer id="events-heatmap" type="heatmap" source="events-heat-source" paint={HEATMAP_PAINT} />
      </GeoJSONSource>

      {/* Photo pins — one real marker per event, centered on the coordinate */}
      {markerEvents.map(({ ev, idx }) => (
        <LibreMarker
          key={ev.id}
          id={ev.id}
          lngLat={[ev.location_lng as number, ev.location_lat as number]}
          anchor="center"
          onPress={() => onEventSelect(ev, idx)}
        >
          <EventMapPin event={ev} active={ev.id === activeEventId} scale={pinScale} />
        </LibreMarker>
      ))}
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
            <Stop offset="0" stopColor={Colors.mapRadarBlue} stopOpacity={0.5} />
            <Stop offset="0.45" stopColor={Colors.mapRadarBlue} stopOpacity={0.28} />
            <Stop offset="0.8" stopColor={Colors.mapRadarBlue} stopOpacity={0.1} />
            <Stop offset="1" stopColor={Colors.mapRadarBlue} stopOpacity={0} />
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
    borderColor: Colors.white,
    marginTop: -8,
    marginLeft: -8,
    shadowColor: Colors.black,
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

const DEFAULT_ZOOM = 11
const ZOOM_MIN = 3
const ZOOM_MAX = 15
const PIN_SCALE_MIN = 0.45
const PIN_SCALE_MAX = 1.15

function pinScaleForZoom(zoom: number) {
  const t = Math.min(1, Math.max(0, (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)))
  return PIN_SCALE_MIN + t * (PIN_SCALE_MAX - PIN_SCALE_MIN)
}

// react-native-maps only reports the visible region (lat/lng deltas), not a
// zoom level — approximate one from longitudeDelta so it can drive the same
// pinScaleForZoom curve used by the MapLibre provider.
function zoomFromLongitudeDelta(longitudeDelta: number) {
  if (!longitudeDelta || longitudeDelta <= 0) return DEFAULT_ZOOM
  return Math.log2(360 / longitudeDelta)
}

// Event marker — just the event's own 16:9 photo, centered on the coordinate.
// The bubble's layout size stays fixed (PIN_W × PIN_H) so the marker's anchor
// point never shifts — the zoom-driven size change is done purely as a
// `transform: scale`, animated with Reanimated so it eases smoothly toward
// each new target instead of snapping every time the zoom level updates.
const EventMapPin = React.memo(function EventMapPin({
  event,
  active,
  scale,
}: {
  event: EventSummary
  active: boolean
  scale: number
}) {
  const cover = event.cover_photos?.[0]?.url
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
  const scaleSV = useSharedValue(scale)

  useEffect(() => {
    scaleSV.value = withTiming(scale, { duration: 220, easing: Easing.out(Easing.quad) })
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSV.value * (active ? 1.12 : 1) }],
  }))

  return (
    <View style={p.wrap}>
      <Animated.View style={[p.bubble, animatedStyle]}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={p.photo}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={[p.photo, p.photoFallback]}>
            <TypeIcon size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
      </Animated.View>
    </View>
  )
})

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
    shadowColor: Colors.black,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
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

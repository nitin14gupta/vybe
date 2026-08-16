import React, { useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import MapView from 'react-native-maps'
import type { Region } from 'react-native-maps'
import { Map, Camera, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native'
import type { NativeSyntheticEvent } from 'react-native'
import * as Location from 'expo-location'
import { useLiveLocation } from '@/hooks/useLiveLocation'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER } from '@/constants/mapConfig'
import { Colors } from '@/constants'

const ADDRESS_DEBOUNCE_MS = 500

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: Colors.surface }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: Colors.background }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: Colors.deepBackground }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
]

interface ViewStateChangeEvent {
  center: [number, number]
  zoom: number
  bounds: [number, number, number, number]
  animated: boolean
  userInteraction: boolean
}

export interface LocationPickerMapProps {
  lat?: number
  lng?: number
  provider?: 'maplibre' | 'google'
  onChange: (lat: number, lng: number) => void
  onAddressDetected?: (address: string) => void
}

export function LocationPickerMap({
  lat,
  lng,
  provider = MAP_PROVIDER,
  onChange,
  onAddressDetected,
}: LocationPickerMapProps) {
  const googleMapRef = useRef<MapView>(null)
  const cameraRef = useRef<CameraRef>(null)
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flownRef = useRef(false)

  const hasCoords = lat != null && lng != null

  // Same hook the Events tab map view uses for the live "you are here" dot —
  // it resolves near-instantly from expo-location's cached last-known-fix
  // (getLastKnownPositionAsync) instead of waiting on a fresh GPS read, so
  // this map centers on the user in a fraction of a second instead of
  // several. Only used when no coords were already supplied.
  const live = useLiveLocation()

  const flyToCoords = (latitude: number, longitude: number) => {
    // Short delay to ensure the map's tile loading has started
    setTimeout(() => {
      if (provider === 'google') {
        googleMapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 },
          1000,
        )
      } else {
        cameraRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1800,
        })
      }
    }, 300)
  }

  const reverseGeocode = async (latitude: number, longitude: number) => {
    if (!onAddressDetected) return
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (place) {
        const parts = [place.name, place.street, place.district, place.city].filter(Boolean)
        const address = parts.join(', ')
        if (address) onAddressDetected(address)
      }
    } catch {
      // Reverse geocoding failed — address input just stays as-is
    }
  }

  // On mount: if coords were already known (editing an existing event, or a
  // prior step already set them), fly straight in.
  useEffect(() => {
    if (hasCoords) {
      flownRef.current = true
      flyToCoords(lat!, lng!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No coords yet — as soon as the live-location hook resolves a fix, use it
  // once. This fires almost immediately off the cached last-known position;
  // watchPositionAsync refining it further afterwards doesn't re-trigger this.
  useEffect(() => {
    if (flownRef.current || hasCoords) return
    if (live.lat == null || live.lng == null) return
    flownRef.current = true
    onChange(live.lat, live.lng)
    flyToCoords(live.lat, live.lng)
    reverseGeocode(live.lat, live.lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.lat, live.lng])

  useEffect(() => () => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
  }, [])

  // Real-time address updates: whenever the pin moves (drag/pan), reverse
  // geocode the new center so the address input bar tracks it live, the same
  // way Google Maps updates the label under a dropped/dragged pin. Debounced
  // so it doesn't fire a lookup on every intermediate frame of a drag.
  const handleRegionChange = (latitude: number, longitude: number) => {
    onChange(latitude, longitude)
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(() => reverseGeocode(latitude, longitude), ADDRESS_DEBOUNCE_MS)
  }

  // ── Google Maps ──────────────────────────────────────────────────────────────

  if (provider === 'google') {
    return (
      <MapView
        ref={googleMapRef}
        style={StyleSheet.absoluteFill}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: DEFAULT_MAP_CENTER.lat,
          longitude: DEFAULT_MAP_CENTER.lng,
          latitudeDelta: 60,
          longitudeDelta: 60,
        }}
        onRegionChangeComplete={(region: Region) => {
          handleRegionChange(region.latitude, region.longitude)
        }}
      />
    )
  }

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={TILE_STYLE.dark}
      onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        if (!event.nativeEvent.userInteraction) return
        const [fLng, fLat] = event.nativeEvent.center
        handleRegionChange(fLat, fLng)
      }}
      logo={false}
      attribution={false}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ zoom: 2 }}
      />
      <UserLocation />
    </Map>
  )
}

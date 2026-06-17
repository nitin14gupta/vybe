import React, { useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import MapView from 'react-native-maps'
import type { Region } from 'react-native-maps'
import { Map, Camera, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native'
import type { NativeSyntheticEvent } from 'react-native'
import * as Location from 'expo-location'
import { MAP_PROVIDER, TILE_STYLE, DEFAULT_MAP_CENTER } from '@/constants/mapConfig'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
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

  const hasCoords = lat != null && lng != null

  // On mount: if coords were pre-fetched by create.tsx (step 2→3 transition),
  // fly in with a dramatic zoom animation. Otherwise detect GPS first, then fly.
  useEffect(() => {
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

    if (hasCoords) {
      // Coords already known — fly straight in
      flyToCoords(lat!, lng!)
      return
    }

    // No coords yet — detect GPS, then fly
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        onChange(coords.latitude, coords.longitude)
        flyToCoords(coords.latitude, coords.longitude)

        // Reverse geocode to suggest an address
        if (onAddressDetected) {
          const [place] = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          if (place) {
            const parts = [place.name, place.street, place.district, place.city].filter(Boolean)
            const address = parts.join(', ')
            if (address) onAddressDetected(address)
          }
        }
      } catch {
        // GPS unavailable — user stays at world view, can type address manually
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Google Maps ──────────────────────────────────────────────────────────────

  if (provider === 'google') {
    return (
      <MapView
        ref={googleMapRef}
        style={StyleSheet.absoluteFillObject}
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
          onChange(region.latitude, region.longitude)
        }}
      />
    )
  }

  // ── MapLibre ─────────────────────────────────────────────────────────────────
  // Map starts at a wide zoom (world view). The useEffect flyTo animates
  // into the user's location with "fly" easing — the nice zoom-from-above effect.

  return (
    <Map
      style={StyleSheet.absoluteFillObject}
      mapStyle={TILE_STYLE.dark}
      onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        if (!event.nativeEvent.userInteraction) return
        const [fLng, fLat] = event.nativeEvent.center
        onChange(fLat, fLng)
      }}
      logo={false}
      attribution={false}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ zoom: 2 }}
      />
      <UserLocation visible />
    </Map>
  )
}

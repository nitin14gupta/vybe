import { useState, useEffect, useRef } from 'react'
import { Linking } from 'react-native'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { useOnboardingStore } from '@/store/onboarding'
import { setLocation } from '@/api/user'
import type { CityResponse } from '@/api/user'
import { usePillStore } from '@/store/pillStore'
import { useCities } from '@/hooks/useCities'

export type { CityResponse }

export function useLocation() {
  const store = useOnboardingStore()
  const showPill = usePillStore.getState().show
  const { cities, loading: citiesLoading, error: citiesError, retry: retryCities } = useCities()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const autoDetected = useRef(false)

  // Request permission immediately, in parallel with the (shared, possibly
  // already-cached) city list — don't make the permission prompt wait on a
  // network round trip.
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') setPermissionGranted(true)
    })
  }, [])

  // Auto-detect once permission is granted AND the city list has settled
  // (loaded or failed) — cities.length alone can't distinguish "still
  // loading" from "loaded empty", so gate on the hook's own loading flag.
  useEffect(() => {
    if (!permissionGranted || citiesLoading || autoDetected.current) return
    autoDetected.current = true
    runDetect(cities)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionGranted, citiesLoading])

  // Core GPS detection — takes cityList explicitly so it works before state settles
  const runDetect = async (cityList: CityResponse[]) => {
    setDetecting(true)
    try {
      const { coords } = await Location.getCurrentPositionAsync({})
      store.setField('lat', coords.latitude)
      store.setField('lng', coords.longitude)

      const [place] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      const detected = place?.city ?? place?.subregion ?? place?.region ?? null
      if (detected) {
        const match = cityList.find(c =>
          c.name.toLowerCase() === detected.toLowerCase() ||
          detected.toLowerCase().includes(c.name.toLowerCase()),
        )
        if (match) {
          store.setField('city', match.name)
          showPill(`${match.name} detected`)
        } else {
          showPill(`${detected} detected — pick the closest city`)
        }
      } else {
        showPill('Location detected — pick your city below')
      }
    } catch {
      showPill('Could not detect location', 'error')
    } finally {
      setDetecting(false)
    }
  }

  // Manual "Use my current location" button
  const detectLocation = async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (!canAskAgain) Linking.openSettings()
        return
      }
      runDetect(cities)
    } catch {
      showPill('Could not access location permissions', 'error')
    }
  }

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.state.toLowerCase().includes(query.toLowerCase()),
  )

  // Manual pick from the list — attach the city's known coordinates too, not
  // just the name, so profile.lat/lng isn't left at 0,0 for anyone who
  // doesn't use "Use my current location".
  const selectCity = (name: string) => {
    store.setField('city', name)
    const match = cities.find(c => c.name === name)
    if (match) {
      store.setField('lat', match.lat)
      store.setField('lng', match.lng)
    }
  }

  const handleContinue = async () => {
    if (!store.city) return
    setLoading(true)
    try {
      await setLocation(store.city, store.lat ?? 0, store.lng ?? 0)
    } catch (e: any) {
      showPill(e?.message || 'Could not save your location, you can update it later', 'error')
    }
    setLoading(false)
    router.replace('/(onboarding)/complete')
  }

  return {
    cities,
    filtered,
    query,
    setQuery,
    selectedCity: store.city,
    loading,
    detecting,
    citiesLoading,
    citiesError,
    retryCities,
    selectCity,
    detectLocation,
    handleContinue,
  }
}

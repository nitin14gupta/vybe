import { useState, useEffect } from 'react'
import { Linking } from 'react-native'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { useOnboardingStore } from '@/store/onboarding'
import { setLocation, getCities } from '@/api/user'
import type { CityResponse } from '@/api/user'
import { usePillStore } from '@/store/pillStore'

export type { CityResponse }

export function useLocation() {
  const store = useOnboardingStore()
  const showPill = usePillStore.getState().show
  const [cities, setCities] = useState<CityResponse[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Load cities and request permission in parallel
      const [data, { status }] = await Promise.all([
        getCities().catch(() => [] as CityResponse[]),
        Location.requestForegroundPermissionsAsync(),
      ])
      setCities(data)
      // If user just allowed (or had already allowed), auto-detect immediately
      if (status === 'granted') {
        runDetect(data)
      }
    }
    init()
  }, [])

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
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      if (!canAskAgain) Linking.openSettings()
      return
    }
    runDetect(cities)
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
    } catch {}
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
    selectCity,
    detectLocation,
    handleContinue,
  }
}

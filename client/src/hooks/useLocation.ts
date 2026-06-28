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
    getCities()
      .then(data => setCities(data))
      .catch(() => {})
  }, [])

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.state.toLowerCase().includes(query.toLowerCase()),
  )

  const selectCity = (name: string) => store.setField('city', name)

  const detectLocation = async () => {
    setDetecting(true)
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (!canAskAgain) Linking.openSettings()
        return
      }
      const { coords } = await Location.getCurrentPositionAsync({})
      store.setField('lat', coords.latitude)
      store.setField('lng', coords.longitude)

      const [place] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      const detected = place?.city ?? place?.subregion ?? place?.region ?? null
      if (detected) {
        const match = cities.find(c =>
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

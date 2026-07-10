import { useCallback, useEffect, useRef, useState } from 'react'
import ApiService, { type EventSummary } from '@/api/apiService'
import type { MapBounds } from '@/constants'
import { useLiveLocation } from '@/hooks/useLiveLocation'

export interface EventFilters {
  category?: string
  is_free?: boolean
  date_range?: 'tonight' | 'weekend' | 'all'
}

export function useEvents() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<EventFilters>({})
  const { lat: userLat, lng: userLng, heading: userHeading, ready: locationReady, status: locationStatus } = useLiveLocation()
  const didInit = useRef(false)

  const load = useCallback(
    async (f: EventFilters, lat?: number, lng?: number) => {
      setLoading(true)
      setError(null)
      try {
        const result = await ApiService.getEvents({
          lat,
          lng,
          radius_km: 50,
          category: f.category && f.category !== 'all' ? f.category : undefined,
          is_free: f.is_free,
          date_range: f.date_range !== 'all' ? f.date_range : undefined,
        })
        setEvents(result)
      } catch (e: any) {
        setError(e.message ?? 'Failed to load events')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Loads events visible in the current map viewport — used by MapLibre's onRegionDidChange.
  const loadInBounds = useCallback(
    async (bounds: MapBounds) => {
      setLoading(true)
      try {
        const result = await ApiService.getEvents({
          ...filters,
          min_lat: bounds.minLat,
          max_lat: bounds.maxLat,
          min_lng: bounds.minLng,
          max_lng: bounds.maxLng,
        })
        setEvents(result)
      } catch {
        // silently ignore viewport reload errors
      } finally {
        setLoading(false)
      }
    },
    [filters],
  )

  // Fires once the live-location permission flow resolves (granted or denied),
  // so the initial load uses coords if available without waiting on the GPS watch.
  useEffect(() => {
    if (!locationReady || didInit.current) return
    didInit.current = true
    load({}, userLat, userLng)
  }, [locationReady, userLat, userLng, load])

  const setFilter = useCallback(
    (key: keyof EventFilters, val: any) => {
      const next = { ...filters, [key]: val }
      setFiltersState(next)
      load(next, userLat, userLng)
    },
    [filters, userLat, userLng, load],
  )

  const reload = useCallback(() => {
    load(filters, userLat, userLng)
  }, [filters, userLat, userLng, load])

  return { events, loading, error, filters, setFilter, reload, loadInBounds, userLat, userLng, userHeading, locationStatus }
}

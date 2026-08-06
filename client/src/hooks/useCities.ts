import { useEffect, useState, useCallback } from 'react'
import { getCities } from '@/api/user'
import type { CityResponse } from '@/api/user'
import { CITIES } from '@/constants/onboarding'

export type { CityResponse }

// Fallback if backend is unreachable — no real coordinates, so "Use my
// current location" still works but manual picks land on 0,0.
const FALLBACK: CityResponse[] = CITIES.map(c => ({ ...c, lat: 0, lng: 0 }))

// Module-level cache — the city list is effectively static reference data,
// so every screen that needs it (onboarding location step, calendar filter's
// city picker, ...) shares one fetch instead of re-requesting on each mount.
let cache: CityResponse[] | null = null
let inflight: Promise<{ data: CityResponse[]; failed: boolean }> | null = null

function fetchCities(): Promise<{ data: CityResponse[]; failed: boolean }> {
  if (cache) return Promise.resolve({ data: cache, failed: false })
  if (!inflight) {
    inflight = getCities()
      .then(data => { cache = data; return { data, failed: false } })
      .catch(() => ({ data: FALLBACK, failed: true }))
      .finally(() => { inflight = null })
  }
  return inflight
}

export function useCities() {
  const [cities, setCities] = useState<CityResponse[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    if (cache) { setCities(cache); setLoading(false); setError(false); return }
    setLoading(true)
    fetchCities().then(({ data, failed }) => {
      setCities(data)
      setError(failed)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetchCities().then(({ data, failed }) => {
      if (cancelled) return
      setCities(data)
      setError(failed)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return { cities, loading, error, retry: load }
}

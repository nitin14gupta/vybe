import { useEffect, useState } from 'react'
import { getCities } from '@/api/user'
import type { CityResponse } from '@/api/user'

export type { CityResponse }

// Module-level cache — the city list is effectively static reference data,
// so every screen that needs it (onboarding location step, calendar filter's
// city picker, ...) shares one fetch instead of re-requesting on each mount.
let cache: CityResponse[] | null = null
let inflight: Promise<CityResponse[]> | null = null

function fetchCities(): Promise<CityResponse[]> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = getCities()
      .then(data => { cache = data; return data })
      .catch(() => [] as CityResponse[])
      .finally(() => { inflight = null })
  }
  return inflight
}

export function useCities() {
  const [cities, setCities] = useState<CityResponse[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetchCities().then(data => { if (!cancelled) { setCities(data); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { cities, loading }
}

import { useEffect } from 'react'
import { useLocationStore } from '@/store/locationStore'

// Reads the app-wide shared GPS/compass watch (see locationStore) — every
// screen sees the same already-warm fix instantly instead of each one
// starting its own watch and waiting on a fresh first callback.
export function useLiveLocation() {
  const start = useLocationStore((s) => s._start)
  useEffect(() => {
    start()
  }, [start])

  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)
  const heading = useLocationStore((s) => s.heading)
  const ready = useLocationStore((s) => s.ready)
  const status = useLocationStore((s) => s.status)

  return { lat, lng, heading, ready, status }
}

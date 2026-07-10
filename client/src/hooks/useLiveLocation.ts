import { useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import ApiService from '@/api/apiService'

// Shortest signed angle from `a` to `b`, wrapped to [-180, 180] — lets us
// low-pass filter a compass heading without jumping the wrong way across
// the 0°/360° seam.
function angleDelta(a: number, b: number) {
  return ((b - a + 540) % 360) - 180
}

// Watches GPS position while the calling component is mounted, keeps lat/lng
// state fresh, and throttles syncing the position to the server.
export function useLiveLocation() {
  const [lat, setLat] = useState<number | undefined>()
  const [lng, setLng] = useState<number | undefined>()
  const [heading, setHeading] = useState<number | undefined>()
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<Location.PermissionStatus | undefined>()
  const subRef = useRef<Location.LocationSubscription | null>(null)
  const headingSubRef = useRef<Location.LocationSubscription | null>(null)
  const smoothedHeadingRef = useRef<number | null>(null)
  const lastHeadingEmitRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync()
        if (perm.status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync()
          if (!cancelled) setStatus(req.status)
          if (req.status !== 'granted' || cancelled) {
            if (!cancelled) setReady(true)
            return
          }
        } else {
          if (!cancelled) setStatus(perm.status)
        }

        const last = await Location.getLastKnownPositionAsync()
        if (last && !cancelled) {
          setLat(last.coords.latitude)
          setLng(last.coords.longitude)
        }
        if (!cancelled) setReady(true)

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 25,
          },
          (position) => {
            setLat(position.coords.latitude)
            setLng(position.coords.longitude)
            ApiService.updateLiveLocation(
              position.coords.latitude,
              position.coords.longitude,
            ).catch(() => {})
          },
        )
        if (cancelled) {
          sub.remove()
        } else {
          subRef.current = sub
        }

        // Compass heading — device orientation via magnetometer, updates even
        // while standing still (unlike GPS bearing, which needs movement).
        // Uses expo-location's own sensor API, independent of the map's
        // native location module. Raw compass readings jitter noticeably, so
        // this exponentially smooths them and throttles how often state
        // (and therefore a re-render) actually happens.
        const headingSub = await Location.watchHeadingAsync((event) => {
          const raw = event.trueHeading >= 0 ? event.trueHeading : event.magHeading
          if (smoothedHeadingRef.current == null) {
            smoothedHeadingRef.current = raw
          } else {
            smoothedHeadingRef.current =
              (smoothedHeadingRef.current + angleDelta(smoothedHeadingRef.current, raw) * 0.15 + 360) % 360
          }
          const now = Date.now()
          if (now - lastHeadingEmitRef.current > 150) {
            lastHeadingEmitRef.current = now
            setHeading(smoothedHeadingRef.current)
          }
        })
        if (cancelled) {
          headingSub.remove()
        } else {
          headingSubRef.current = headingSub
        }
      } catch {}
    })()

    return () => {
      cancelled = true
      subRef.current?.remove()
      subRef.current = null
      headingSubRef.current?.remove()
      headingSubRef.current = null
    }
  }, [])

  return { lat, lng, heading, ready, status }
}

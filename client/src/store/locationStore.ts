import { create } from 'zustand'
import * as Location from 'expo-location'
import ApiService from '@/api/apiService'

// Shortest signed angle from `a` to `b`, wrapped to [-180, 180] — lets us
// low-pass filter a compass heading without jumping the wrong way across
// the 0°/360° seam.
function angleDelta(a: number, b: number) {
  return ((b - a + 540) % 360) - 180
}

interface LocationState {
  lat?: number
  lng?: number
  heading?: number
  ready: boolean
  status?: Location.PermissionStatus
  _started: boolean
  _start: () => void
}

let posSub: Location.LocationSubscription | null = null
let headingSub: Location.LocationSubscription | null = null
let smoothedHeading: number | null = null
let lastHeadingEmit = 0

export const useLocationStore = create<LocationState>((set, get) => ({
  lat: undefined,
  lng: undefined,
  heading: undefined,
  ready: false,
  status: undefined,
  _started: false,

  // Idempotent — first caller starts the watch, everyone else just reads
  // whatever state is already there (instantly, since it's a live subscription).
  _start: () => {
    if (get()._started) return
    set({ _started: true })

    ;(async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync()
        let status = perm.status
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync()
          status = req.status
        }
        set({ status })
        if (status !== 'granted') {
          set({ ready: true })
          return
        }

        const last = await Location.getLastKnownPositionAsync()
        if (last) {
          set({ lat: last.coords.latitude, lng: last.coords.longitude })
        }
        set({ ready: true })

        posSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 25,
          },
          (position) => {
            set({ lat: position.coords.latitude, lng: position.coords.longitude })
            ApiService.updateLiveLocation(
              position.coords.latitude,
              position.coords.longitude,
            ).catch(() => {})
          },
        )

        // Compass heading — device orientation via magnetometer, updates even
        // while standing still (unlike GPS bearing, which needs movement).
        // Raw compass readings jitter noticeably, so this exponentially
        // smooths them and throttles how often state (and re-renders) happen.
        headingSub = await Location.watchHeadingAsync((event) => {
          const raw = event.trueHeading >= 0 ? event.trueHeading : event.magHeading
          if (smoothedHeading == null) {
            smoothedHeading = raw
          } else {
            smoothedHeading = (smoothedHeading + angleDelta(smoothedHeading, raw) * 0.15 + 360) % 360
          }
          const now = Date.now()
          if (now - lastHeadingEmit > 150) {
            lastHeadingEmit = now
            set({ heading: smoothedHeading! })
          }
        })
      } catch {}
    })()
  },
}))

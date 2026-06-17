// ── Map provider switch ───────────────────────────────────────────────────────
// Change this one line to switch all map components in the app.
// 'maplibre' → OpenFreeMap (free, no API key, no rate limits)
// 'google'   → react-native-maps (Google Maps on Android, Apple MapKit on iOS)
export const MAP_PROVIDER: 'maplibre' | 'google' = 'maplibre'

// Tile style URLs for MapLibre provider.
// Swap TILE_STYLE to a self-hosted OpenMapTiles AWS endpoint in Phase 2 — no other code changes needed.
export const TILE_STYLE = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  positron: 'https://tiles.openfreemap.org/styles/positron',
} as const

// Default map center (Mumbai)
export const DEFAULT_MAP_CENTER = { lat: 19.076, lng: 72.877 }

export interface MapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

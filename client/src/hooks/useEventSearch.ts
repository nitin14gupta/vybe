import { useEffect, useRef, useState } from 'react'
import ApiService, { type EventSummary } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { parseServerDate } from '@/lib/dates'

const DEBOUNCE_MS = 400

// Maps a FILTER_CHIPS key to the server-side query params `list_events` expects.
function chipToServerFilters(chipKey: string) {
  if (chipKey === 'free') return { is_free: true }
  if (chipKey === 'tonight') return { date_range: 'tonight' }
  if (chipKey === 'weekend') return { date_range: 'weekend' }
  if (chipKey === 'all') return {}
  return { category: chipKey } // music, dinner, house_party, game_night
}

function isUpcomingActive(event: EventSummary): boolean {
  if (event.is_cancelled) return false
  const d = parseServerDate(event.date_time)
  return !d || d.getTime() > Date.now()
}

export function useEventSearch(lat?: number | null, lng?: number | null) {
  const [query, setQuery] = useState('')
  const [chipKey, setChipKey] = useState('all')
  const [results, setResults] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState(false)

  const [hostedEvents, setHostedEvents] = useState<EventSummary[]>([])
  const [hostedLoading, setHostedLoading] = useState(false)
  const hasFetchedHosted = useRef(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestId = useRef(0)

  const fetchHostedOnce = () => {
    if (hasFetchedHosted.current) return
    hasFetchedHosted.current = true
    setHostedLoading(true)
    ApiService.getMyHostedEvents()
      .then(events => setHostedEvents(events.filter(isUpcomingActive)))
      .catch(() => {
        usePillStore.getState().show("Couldn't load your hosted events", 'error')
      })
      .finally(() => setHostedLoading(false))
  }

  const runSearch = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const myRequestId = ++requestId.current
    setLoading(true)
    setSearchError(false)
    try {
      const data = await ApiService.getEvents({
        q: trimmed,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radius_km: 50,
        limit: 12,
        ...chipToServerFilters(chipKey),
      })
      if (myRequestId !== requestId.current) return // a newer search superseded this one
      setResults(data)
      setSearched(true)
    } catch {
      if (myRequestId !== requestId.current) return
      setResults([])
      setSearched(true)
      setSearchError(true)
      usePillStore.getState().show("Couldn't search events, try again", 'error')
    } finally {
      if (myRequestId === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      setSearchError(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(q), DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, chipKey, lat, lng])

  return {
    query, setQuery,
    chipKey, setChipKey,
    results, loading, searched, searchError,
    hostedEvents, hostedLoading, fetchHostedOnce,
  }
}

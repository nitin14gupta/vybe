import { useState, useEffect } from 'react'

export function useLocationSearch(lat?: number | null, lng?: number | null) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchOpen) return

    const delay = setTimeout(async () => {
      setLoading(true)
      try {
        // Strip Google Plus Codes (e.g. "4RRV+PHP, ") if pasted from Google Maps
        const cleanQuery = query.replace(/^[a-zA-Z0-9]{2,8}\+[a-zA-Z0-9]{2,3}[,\s]*/, '').trim()

        if (!cleanQuery && lat && lng) {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          const res = await fetch(url, { headers: { 'User-Agent': 'VybeApp/1.0' } })
          const data = await res.json()
          if (data && data.place_id) {
            setResults([data])
          } else {
            setResults([])
          }
        } else if (cleanQuery) {
          let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=jsonv2&limit=12&countrycodes=in`
          if (lat && lng) {
            url += `&lat=${lat}&lon=${lng}`
          }
          const res = await fetch(url, { headers: { 'User-Agent': 'VybeApp/1.0' } })
          const data = await res.json()
          setResults(data)
        } else {
          setResults([])
        }
      } catch (e) {
        console.warn('Location search error:', e)
      } finally {
        setLoading(false)
      }
    }, 600)
    return () => clearTimeout(delay)
  }, [query, lat, lng, searchOpen])

  return {
    searchOpen,
    setSearchOpen,
    query,
    setQuery,
    results,
    loading,
  }
}

import { useEffect, useState } from 'react'
import ApiService from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'

// Optimistic add/remove from the hotlist (saved/bookmarked events — see
// server routes/events.py's event_hotlist table). Shared by EventCard and
// the event detail screen so both stay in sync with the same behavior.
export function useHotlistToggle(eventId: string, initial: boolean | undefined) {
  const [hotlisted, setHotlisted] = useState(!!initial)
  const showPill = usePillStore(s => s.show)

  // Resync when the underlying event identity changes (e.g. a different
  // list item reusing this component) — not on every re-render, so it
  // doesn't fight the optimistic local state right after a toggle.
  useEffect(() => { setHotlisted(!!initial) }, [eventId])

  const toggle = async () => {
    hTap()
    const next = !hotlisted
    setHotlisted(next)
    try {
      if (next) await ApiService.addToHotlist(eventId)
      else await ApiService.removeFromHotlist(eventId)
      showPill(next ? 'Added to hotlist' : 'Removed from hotlist')
    } catch {
      setHotlisted(!next)
      showPill("Couldn't update hotlist, try again", 'error')
    }
  }

  return { hotlisted, toggle }
}

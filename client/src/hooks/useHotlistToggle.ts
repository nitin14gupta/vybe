import ApiService from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { useHotlistStore } from '@/store/hotlistStore'

// Optimistic add/remove from the hotlist (saved/bookmarked events — see
// server routes/events.py's event_hotlist table). Shared by EventCard and
// the event detail screen. State lives in useHotlistStore (keyed by
// eventId) instead of local component state, so every card for the same
// event — calendar, recently viewed, event detail, the hotlist screen
// itself — flips together the moment any one of them is toggled.
export function useHotlistToggle(eventId: string, initial: boolean | undefined) {
  const showPill = usePillStore(s => s.show)
  const override = useHotlistStore(s => s.overrides[eventId])
  const setHotlisted = useHotlistStore(s => s.setHotlisted)
  const hotlisted = override !== undefined ? override : !!initial

  const toggle = async () => {
    hTap()
    const next = !hotlisted
    setHotlisted(eventId, next)
    try {
      if (next) await ApiService.addToHotlist(eventId)
      else await ApiService.removeFromHotlist(eventId)
      showPill(next ? 'Added to hotlist' : 'Removed from hotlist')
    } catch {
      setHotlisted(eventId, !next)
      showPill("Couldn't update hotlist, try again", 'error')
    }
  }

  return { hotlisted, toggle }
}

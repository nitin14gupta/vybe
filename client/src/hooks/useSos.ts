import { useState } from 'react'
import ApiService from '@/api/apiService'
import { hError, hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { useLiveLocation } from '@/hooks/useLiveLocation'

export function useSos(eventId?: string) {
  const { lat, lng } = useLiveLocation()
  const showPill = usePillStore(s => s.show)
  const [sending, setSending] = useState(false)

  const sendSos = async (): Promise<boolean> => {
    if (sending) return false
    if (lat == null || lng == null) {
      hError()
      showPill('Turn on location to send SOS', 'error')
      return false
    }
    setSending(true)
    try {
      const { alerted } = await ApiService.triggerSos({ event_id: eventId, lat, lng })
      hSuccess()
      showPill(alerted > 0 ? `SOS sent to ${alerted} contact${alerted === 1 ? '' : 's'}` : 'SOS sent')
      return true
    } catch (e: any) {
      hError()
      showPill(e?.message ?? "Couldn't send SOS, try again", 'error')
      return false
    } finally {
      setSending(false)
    }
  }

  return { sendSos, sending }
}

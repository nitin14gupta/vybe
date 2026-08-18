import { useCallback, useEffect, useState } from 'react'
import ApiService, { type WaitlistEntry } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

export function useManageWaitlist(id: string | undefined) {
  const showPill = usePillStore(s => s.show)

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [admitting, setAdmitting] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setLoadError(false)
    try {
      const res = await ApiService.getEventWaitlist(id)
      setWaitlist(res.waitlist)
    } catch {
      setLoadError(true)
      showPill("Couldn't load waitlist", 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleAdmit = async () => {
    if (!id || admitting) return
    setAdmitting(true)
    try {
      const res = await ApiService.admitFromWaitlist(id)
      if (res.admitted) {
        showPill(`${res.admitted.name ?? 'User'} has been offered a spot`, 'default')
        load()
      } else {
        showPill('Waitlist is empty', 'default')
      }
    } catch (e: any) {
      showPill(e?.message ?? "Couldn't admit from waitlist", 'error')
    } finally {
      setAdmitting(false)
    }
  }

  const pending = waitlist.filter(w => !w.offer_expires_at)
  const offered = waitlist.filter(w => w.offer_expires_at)

  return { waitlist, loading, refreshing, loadError, admitting, pending, offered, handleAdmit, reload: load }
}

import { useState } from 'react'
import { useRouter } from 'expo-router'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

export function useLeaveWaitlist(id: string) {
  const [leaving, setLeaving] = useState(false)
  const showPill = usePillStore(s => s.show)
  const router = useRouter()

  const leave = async () => {
    setLeaving(true)
    try {
      await ApiService.rsvpEvent(id, 'cancel')
      showPill('Removed from waitlist', 'default')
      router.back()
    } catch {
      showPill("Couldn't leave waitlist, try again", 'error')
      setLeaving(false)
    }
  }

  return { leaving, leave }
}

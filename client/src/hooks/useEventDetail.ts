import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useFocusEffect, useRouter } from 'expo-router'
import ApiService, { type EventDetail, type EventAttendee, type EventGuest } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import { usePillStore } from '@/store/pillStore'
import { calcAge, hoursUntil, parseDate, type RsvpStatus } from '@/components/events/eventDetailUtils'

export function useEventDetail(id: string | undefined) {
  const router = useRouter()
  const myId = useAuthStore(s => s.userId)
  const myDob = useAuthStore(s => s.dob)
  const showPill = usePillStore(s => s.show)

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('idle')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [lockedReason, setLockedReason] = useState<null | 'checkin' | 'edit' | 'cancel' | 'age'>(null)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [guestTotal, setGuestTotal] = useState(0)
  const [guestWaitlist, setGuestWaitlist] = useState<EventGuest[]>([])
  const [guestsLoading, setGuestsLoading] = useState(false)
  const [guestSheetOpen, setGuestSheetOpen] = useState(false)
  const [offerSecondsLeft, setOfferSecondsLeft] = useState<number | null>(null)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [addressSheetOpen, setAddressSheetOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        useRecentEventsStore.getState().add(ev)
        if (ev.my_rsvp_status === 'going' || ev.my_rsvp_status === 'waitlist') {
          setRsvpStatus(ev.my_rsvp_status)
        }
        if (ev.host_id === myId) {
          setAttendeesLoading(true)
          ApiService.getEventAttendees(id)
            .then(r => setAttendees(r.attendees))
            .catch(() => { })
            .finally(() => setAttendeesLoading(false))
        }
        setGuestsLoading(true)
        ApiService.getEventGuests(id)
          .then(r => {
            setGuests(r.guests)
            setGuestTotal(r.total)
            setGuestWaitlist(r.waitlist)
          })
          .catch(() => { })
          .finally(() => setGuestsLoading(false))
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id, myId]))

  useEffect(() => {
    if (!event?.my_offer_expires_at) { setOfferSecondsLeft(null); return }
    const tick = () => {
      const offerExpiry = parseDate(event.my_offer_expires_at)
      const eventStart = parseDate(event.date_time)
      if (!offerExpiry) return
      // Confirm deadline = whichever comes first: offer window OR event start
      const deadline = eventStart
        ? Math.min(offerExpiry.getTime(), eventStart.getTime())
        : offerExpiry.getTime()
      setOfferSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [event?.my_offer_expires_at, event?.date_time])

  const handleRefresh = useCallback(async () => {
    if (!id) return
    setRefreshing(true)
    try {
      const ev = await ApiService.getEvent(id)
      setEvent(ev)
    } catch (e: any) {
      showPill(e?.message || "Couldn't refresh this event", 'error')
    } finally {
      setRefreshing(false)
    }
  }, [id, showPill])

  const handleRsvp = useCallback(async () => {
    if (!event) return
    if (event.age_restriction) {
      let dob = myDob
      if (!dob) {
        try {
          const me = await ApiService.getMe()
          dob = me.dob ?? null
          if (dob) useAuthStore.getState().setDob(dob)
        } catch { }
      }
      if (dob && calcAge(dob) < event.age_restriction) {
        setLockedReason('age')
        return
      }
    }
    router.push(`/(events)/${id}/book` as any)
  }, [event, myDob, id, router])

  const handleScanner = useCallback(() => {
    if (!event) return
    if (hoursUntil(event.date_time) > 3) {
      setLockedReason('checkin')
    } else {
      router.push(`/(events)/${id}/scanner` as any)
    }
  }, [event, id, router])

  const handleEditEvent = useCallback(() => {
    if (!event) return
    if (hoursUntil(event.date_time) < 2) {
      setLockedReason('edit')
    } else {
      router.push(`/(events)/${id}/edit` as any)
    }
  }, [event, id, router])

  const handleCancelEvent = useCallback(() => {
    if (!event) return
    if (hoursUntil(event.date_time) < 48) {
      setLockedReason('cancel')
    } else {
      setCancelConfirm(true)
    }
  }, [event])

  const doCancelEvent = useCallback(async () => {
    try {
      await ApiService.cancelEvent(id!)
      setEvent(prev => prev ? { ...prev, is_cancelled: true } : prev)
      useRecentEventsStore.getState().remove(id!)
      showPill('Event cancelled', 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't cancel this event, try again", 'error')
    }
  }, [id, showPill])

  const handleShare = useCallback(() => {
    if (!event) return
    setShareSheetOpen(true)
  }, [event])

  const handleJoinWaitlist = useCallback(async () => {
    if (!event) return
    setRsvpStatus('loading')
    try {
      const res = await ApiService.rsvpEvent(id!, 'going')
      if (res.status === 'waitlist') {
        setRsvpStatus('waitlist')
        setEvent(prev => prev ? { ...prev, spots_left: 0 } : prev)
        showPill("You're on the waitlist", 'default')
        router.push({
          pathname: '/(events)/[id]/waitlist-joined' as any,
          params: {
            id: id!,
            position: String(res.position ?? 1),
            coverUrl: event.cover_photos?.[0]?.url ?? '',
            title: event.title,
          },
        })
      } else if (res.status === 'going') {
        setRsvpStatus('going')
        showPill("You're going! 🎉", 'default')
      }
    } catch (e: any) {
      setRsvpStatus('idle')
      showPill(e?.message || "Couldn't join waitlist", 'error')
    }
  }, [event, id, router, showPill])

  const handleLeaveWaitlist = useCallback(async () => {
    if (!event) return
    setRsvpStatus('loading')
    try {
      await ApiService.rsvpEvent(id!, 'cancel')
      setRsvpStatus('idle')
      setEvent(prev => prev ? {
        ...prev,
        my_offer_expires_at: null,
        my_waitlist_position: null,
      } : prev)
      showPill("You've left the waitlist", 'default')
    } catch (e: any) {
      setRsvpStatus('waitlist')
      showPill(e?.message || "Couldn't leave waitlist", 'error')
    }
  }, [event, id, showPill])

  const handleManageWaitlist = useCallback(() => {
    router.push(`/(events)/${id}/waitlist` as any)
  }, [id, router])

  const handleAddressAction = useCallback((key: string) => {
    if (!event) return
    if (key === 'copy') {
      Clipboard.setStringAsync(event.location_name ?? '')
      showPill('Address copied', 'default')
    } else if (key === 'maps') {
      const query = event.location_lat != null && event.location_lng != null
        ? `${event.location_lat},${event.location_lng}`
        : encodeURIComponent(event.location_name ?? '')
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
        showPill("Couldn't open Maps", 'error')
      })
    }
  }, [event, showPill])

  const now = new Date()
  const eventStart = event ? parseDate(event.date_time) : null
  const eventEnd = event?.end_time ? parseDate(event.end_time) : null
  const isStarted = !!eventStart && eventStart < now
  const isEnded = isStarted && (eventEnd ? eventEnd < now : true)
  const isInProgress = isStarted && !isEnded
  const isPast = isEnded
  const hasTicket = !!(event?.my_ticket_token)
  const shouldWaitlist = !!event && (event.spots_left === 0 || (event.waitlist_count ?? 0) > 0)
  const spotsLow = !!event && !shouldWaitlist && event.spots_left <= 10 && !event.is_free
  const isGoing = rsvpStatus === 'going'
  const isWaitlist = rsvpStatus === 'waitlist'
  const coverPhotos = event?.cover_photos ?? []

  return {
    myId,
    event,
    loading,
    rsvpStatus,
    optionsOpen, setOptionsOpen,
    cancelConfirm, setCancelConfirm,
    reportOpen, setReportOpen,
    lockedReason, setLockedReason,
    attendees,
    attendeesLoading,
    guests,
    guestTotal,
    guestWaitlist,
    guestsLoading,
    guestSheetOpen, setGuestSheetOpen,
    offerSecondsLeft,
    shareSheetOpen, setShareSheetOpen,
    addressSheetOpen, setAddressSheetOpen,
    refreshing,
    handleRefresh,
    handleRsvp,
    handleScanner,
    handleEditEvent,
    handleCancelEvent,
    doCancelEvent,
    handleShare,
    handleJoinWaitlist,
    handleLeaveWaitlist,
    handleManageWaitlist,
    handleAddressAction,
    isStarted,
    isEnded,
    isInProgress,
    isPast,
    hasTicket,
    shouldWaitlist,
    spotsLow,
    isGoing,
    isWaitlist,
    coverPhotos,
  }
}

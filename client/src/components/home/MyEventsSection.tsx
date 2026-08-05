import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { UpNextSection } from './UpNextSection'
import { HostingSection } from './HostingSection'

function upcomingSorted(events: EventSummary[]) {
  return events
    .filter(e => !isEventPast(e) && !e.is_cancelled)
    .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export function MyEventsSection({ onEmptyChange }: Props) {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])

  useFocusEffect(useCallback(() => {
    let active = true
    Promise.all([
      ApiService.getMyJoinedEvents().catch(() => []),
      ApiService.getMyHostedEvents().catch(() => []),
    ]).then(([joinedData, hostedData]) => {
      if (!active) return
      const j = upcomingSorted(joinedData)
      const h = upcomingSorted(hostedData)
      setJoined(j)
      setHosted(h)
      onEmptyChange?.(j.length === 0 && h.length === 0)
    })
    return () => { active = false }
  }, []))

  if (joined.length === 0 && hosted.length === 0) return null

  const nearestJoined = joined[0] ? parseServerDate(joined[0].date_time)?.getTime() ?? Infinity : Infinity
  const nearestHosted = hosted[0] ? parseServerDate(hosted[0].date_time)?.getTime() ?? Infinity : Infinity

  const going = <UpNextSection events={joined} />
  const hosting = <HostingSection events={hosted} />

  return nearestHosted < nearestJoined ? (
    <>
      {hosting}
      {going}
    </>
  ) : (
    <>
      {going}
      {hosting}
    </>
  )
}

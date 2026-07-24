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

// Fetches both "going" and "hosting" lists once, then orders the two
// sections by whichever has the nearer upcoming date — e.g. a hosted event
// on the 27th shows above a joined event on the 29th, and vice versa.
export function MyEventsSection() {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])

  useFocusEffect(useCallback(() => {
    Promise.all([
      ApiService.getMyJoinedEvents().catch(() => []),
      ApiService.getMyHostedEvents().catch(() => []),
    ]).then(([joinedData, hostedData]) => {
      setJoined(upcomingSorted(joinedData))
      setHosted(upcomingSorted(hostedData))
    })
  }, []))

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

import { memo, useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { SosButton } from '@/components/events/SosButton'
import { parseServerDate, isEventActive } from '@/lib/dates'
import { Colors, FontFamily, withOpacity } from '@/constants'

const CARD_WIDTH = 240

function activeSorted(events: EventSummary[]) {
  return events
    .filter(e => isEventActive(e) && !e.is_cancelled)
    .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
}

const ActiveEventCard = memo(function ActiveEventCard({ event }: { event: EventSummary }) {
  return (
    <View style={s.card}>
      <EventCard event={event} showHost onPress={() => router.push(`/(events)/${event.id}` as any)} />
      <SosButton eventId={event.id} size={15} style={s.sosBadge} />
    </View>
  )
})

// Events the user has joined that are happening right this moment (between
// start and end time) — separate from "You're Going" (upcoming) below it.
// Surfaces the SOS action directly on the card, since this is exactly the
// moment it'd actually be used.
export function ActiveEventsSection({ onEmptyChange }: { onEmptyChange?: (empty: boolean) => void }) {
  const [events, setEvents] = useState<EventSummary[]>([])

  useFocusEffect(useCallback(() => {
    let active = true
    ApiService.getMyJoinedEvents()
      .then(data => {
        if (!active) return
        const sorted = activeSorted(data)
        setEvents(sorted)
        onEmptyChange?.(sorted.length === 0)
      })
      .catch(() => {})
    return () => { active = false }
  }, [onEmptyChange]))

  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <View style={s.titleRow}>
        <View style={s.liveDot} />
        <Text style={s.title}>Happening Now</Text>
      </View>
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => <ActiveEventCard event={item} />}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.destructive },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  list: { gap: 12, paddingRight: 4 },
  card: { width: CARD_WIDTH },
  sosBadge: {
    position: 'absolute', bottom: 12, right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: withOpacity(Colors.background, 0.55),
  },
})

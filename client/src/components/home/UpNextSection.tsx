import { memo, useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, type ListRenderItemInfo } from 'react-native'
import { router } from 'expo-router'
import { QrCode, ChevronRight } from 'lucide-react-native'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { parseServerDate } from '@/lib/dates'
import { Colors, FontFamily } from '@/constants'

const CARD_WIDTH = 240
const CARD_GAP = 12
const INITIAL_COUNT = 6
const PAGE_SIZE = 6

export function relativeDayLabel(date: Date): string {
  const now = new Date()
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventMid = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((eventMid.getTime() - todayMid.getTime()) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `This ${date.toLocaleDateString('en-US', { weekday: 'long' })}`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const UpNextCard = memo(function UpNextCard({ event, onPress, onTicketPress }: {
  event: EventSummary
  onPress: (id: string) => void
  onTicketPress: (id: string) => void
}) {
  const d = parseServerDate(event.date_time)
  return (
    <View style={s.card}>
      <EventCard
        event={event}
        showHost
        onPress={() => onPress(event.id)}
        footer={
          <Pressable style={s.ticketFooter} onPress={() => onTicketPress(event.id)}>
            <QrCode size={15} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.ticketFooterText}>
              {d ? relativeDayLabel(d) : ''} · View Ticket
            </Text>
            <ChevronRight size={15} color={Colors.inkSecondary} strokeWidth={2} />
          </Pressable>
        }
      />
    </View>
  )
})

// You're almost always going to fewer than a screenful of events here, but
// the same "reveal a page at a time on scroll" pattern as TrendingSection
// costs nothing and keeps behavior consistent if that ever isn't true.
export function UpNextSection({ events }: { events: EventSummary[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  const handlePress = useCallback((id: string) => router.push(`/(events)/${id}` as any), [])
  const handleTicketPress = useCallback((id: string) => router.push(`/(events)/${id}/ticket` as any), [])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<EventSummary>) => (
    <UpNextCard event={item} onPress={handlePress} onTicketPress={handleTicketPress} />
  ), [handlePress, handleTicketPress])

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: CARD_WIDTH,
    offset: (CARD_WIDTH + CARD_GAP) * index,
    index,
  }), [])

  if (events.length === 0) return null

  const visible = events.slice(0, visibleCount)

  return (
    <View style={s.wrap}>
      <Text style={s.title}>You're Going</Text>
      <FlatList
        data={visible}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={s.list}
        onEndReachedThreshold={0.5}
        onEndReached={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, events.length))}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={INITIAL_COUNT}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  list: { gap: 12, paddingRight: 4 },
  card: { width: CARD_WIDTH },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.elevated,
    paddingVertical: 12,
  },
  ticketFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})

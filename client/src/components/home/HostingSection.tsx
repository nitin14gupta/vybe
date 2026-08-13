import { memo, useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, type ListRenderItemInfo } from 'react-native'
import { router } from 'expo-router'
import { Users, ChevronRight } from 'lucide-react-native'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { parseServerDate } from '@/lib/dates'
import { relativeDayLabel } from './UpNextSection'
import { Colors, FontFamily } from '@/constants'

const CARD_WIDTH = 240
const CARD_GAP = 12
const INITIAL_COUNT = 6
const PAGE_SIZE = 6

const HostingCard = memo(function HostingCard({ event, onPress, onManagePress }: {
  event: EventSummary
  onPress: (id: string) => void
  onManagePress: (id: string) => void
}) {
  const d = parseServerDate(event.date_time)
  return (
    <View style={s.card}>
      <EventCard
        event={event}
        onPress={() => onPress(event.id)}
        footer={
          <Pressable style={s.manageFooter} onPress={() => onManagePress(event.id)}>
            <Users size={15} color={Colors.brandOrange} strokeWidth={2} />
            <Text style={s.manageFooterText}>
              {d ? relativeDayLabel(d) : ''} · Manage
            </Text>
            <ChevronRight size={15} color={Colors.inkSecondary} strokeWidth={2} />
          </Pressable>
        }
      />
    </View>
  )
})

// Same "reveal a page at a time on scroll" pattern as TrendingSection —
// you're almost always hosting fewer than a screenful, but it costs nothing
// to stay consistent if that ever isn't true.
export function HostingSection({ events }: { events: EventSummary[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  const handlePress = useCallback((id: string) => router.push(`/(events)/${id}` as any), [])
  const handleManagePress = useCallback((id: string) => router.push(`/(events)/${id}/attendees` as any), [])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<EventSummary>) => (
    <HostingCard event={item} onPress={handlePress} onManagePress={handleManagePress} />
  ), [handlePress, handleManagePress])

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: CARD_WIDTH,
    offset: (CARD_WIDTH + CARD_GAP) * index,
    index,
  }), [])

  if (events.length === 0) return null

  const visible = events.slice(0, visibleCount)

  return (
    <View style={s.wrap}>
      <Text style={s.title}>You're Hosting</Text>
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
  manageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.elevated,
    paddingVertical: 12,
  },
  manageFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})

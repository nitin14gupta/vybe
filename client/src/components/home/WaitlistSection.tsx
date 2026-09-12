import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, type ListRenderItemInfo } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Clock, ChevronRight } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { getOrFetch, invalidate } from '@/lib/queryCache'
import { isEventPast } from '@/lib/dates'
import { CacheKeys, Colors, FontFamily } from '@/constants'

const CARD_WIDTH = 240
const CARD_GAP = 12
const INITIAL_COUNT = 6
const PAGE_SIZE = 6

function upcomingSorted(events: EventSummary[]) {
  return events.filter(e => !isEventPast(e) && !e.is_cancelled)
}

function WaitlistCard({ event, onPress }: { event: EventSummary; onPress: (id: string) => void }) {
  return (
    <View style={s.card}>
      <EventCard
        event={event}
        showHost
        onPress={() => onPress(event.id)}
        footer={
          <View style={s.footer}>
            <Clock size={15} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.footerText}>Waiting for a spot</Text>
            <ChevronRight size={15} color={Colors.inkSecondary} strokeWidth={2} />
          </View>
        }
      />
    </View>
  )
}

export interface WaitlistSectionHandle {
  /** Force a fresh fetch, bypassing the cache — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export const WaitlistSection = forwardRef<WaitlistSectionHandle, Props>(function WaitlistSection(
  { onEmptyChange },
  ref,
) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const mountedRef = useRef(true)

  const load = useCallback((force: boolean) => {
    const fetch = () =>
      getOrFetch(CacheKeys.homeWaitlistedEvents, () => ApiService.getMyWaitlistedEvents(), { ttlMs: 5 * 60_000, persist: false })
    return (force ? invalidate(CacheKeys.homeWaitlistedEvents).then(fetch) : fetch())
      .then(data => {
        if (!mountedRef.current) return
        const sorted = upcomingSorted(data)
        setEvents(sorted)
        setVisibleCount(INITIAL_COUNT)
        onEmptyChange?.(sorted.length === 0)
      })
      .catch(() => {})
  }, [onEmptyChange])

  useImperativeHandle(ref, () => ({
    refresh: () => load(true),
  }), [load])

  useFocusEffect(useCallback(() => {
    mountedRef.current = true
    load(false)
    return () => { mountedRef.current = false }
  }, [load]))

  const handlePress = useCallback((id: string) => router.push(`/(events)/${id}` as any), [])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<EventSummary>) => (
    <WaitlistCard event={item} onPress={handlePress} />
  ), [handlePress])

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: CARD_WIDTH,
    offset: (CARD_WIDTH + CARD_GAP) * index,
    index,
  }), [])

  if (events.length === 0) return null

  const visible = events.slice(0, visibleCount)

  return (
    <View style={s.wrap}>
      <Text style={s.title}>On the Waitlist</Text>
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
})

const s = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  list: { gap: 12, paddingRight: 4 },
  card: { width: CARD_WIDTH },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.elevated,
    paddingVertical: 12,
  },
  footerText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
})

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, StyleSheet, FlatList, type ListRenderItemInfo } from 'react-native'
import { router } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { useProfile } from '@/hooks/useProfile'
import { Colors, FontFamily } from '@/constants'

const CARD_WIDTH = 240
const CARD_GAP = 12
const INITIAL_COUNT = 6
const PAGE_SIZE = 6
const FETCH_LIMIT = 30

const TrendingCard = memo(function TrendingCard({ event, onPress }: {
  event: EventSummary
  onPress: (id: string) => void
}) {
  const handlePress = useCallback(() => onPress(event.id), [onPress, event.id])
  return (
    <View style={s.card}>
      <EventCard event={event} onPress={handlePress} />
    </View>
  )
})

export interface TrendingSectionHandle {
  /** Force a fresh fetch — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  /** Reports whether this section has nothing to show, once its fetch
   * resolves — the home screen combines this with the other two sections'
   * emptiness to decide whether to show a single "nothing here yet" state,
   * instead of each section showing its own. */
  onEmptyChange?: (empty: boolean) => void
}

// "Trending" has no dedicated backend signal yet — nearby events ranked by
// current attendee_count is a reasonable stand-in and needs no new endpoint.
// The API has no offset/page param, so we over-fetch once (FETCH_LIMIT) and
// reveal more of the already-sorted batch as the user scrolls — simple lazy
// loading without a second network round-trip per page.
export const TrendingSection = forwardRef<TrendingSectionHandle, Props>(function TrendingSection(
  { onEmptyChange },
  ref,
) {
  const { profile } = useProfile()
  const [allEvents, setAllEvents] = useState<EventSummary[]>([])
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const mountedRef = useRef(true)

  const load = useCallback((): Promise<void> => {
    const loadTrending = (lat: number, lng: number) =>
      ApiService.getEvents({ lat, lng, radius_km: 40, limit: FETCH_LIMIT })
        .then(result => {
          if (!mountedRef.current) return
          const sorted = [...result].sort((a, b) => b.attendee_count - a.attendee_count)
          setAllEvents(sorted)
          setVisibleCount(INITIAL_COUNT)
          onEmptyChange?.(sorted.length === 0)
        })
        .catch(() => {})

    const { lat, lng, city } = profile ?? {}
    // 0,0 isn't a real location — it's what a manually-picked city used to
    // save before city coordinates existed. Treat it the same as "unset".
    const hasRealCoords = lat != null && lng != null && (lat !== 0 || lng !== 0)
    if (hasRealCoords) return loadTrending(lat!, lng!)
    if (!city) return Promise.resolve()

    // Self-heal: this profile has a city name but no real coordinates behind
    // it — look up the city's known lat/lng and backfill the profile so this
    // repair only has to happen once.
    return ApiService.getCities()
      .then(cities => {
        if (!mountedRef.current) return
        const match = cities.find(c => c.name === city)
        if (!match) return
        ApiService.setLocation(city, match.lat, match.lng).catch(() => {})
        return loadTrending(match.lat, match.lng)
      })
      .catch(() => {})
  }, [profile?.lat, profile?.lng, profile?.city, onEmptyChange])

  useImperativeHandle(ref, () => ({ refresh: load }), [load])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  const handleCardPress = useCallback((id: string) => {
    router.push(`/(events)/${id}` as any)
  }, [])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<EventSummary>) => (
    <TrendingCard event={item} onPress={handleCardPress} />
  ), [handleCardPress])

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: CARD_WIDTH,
    offset: (CARD_WIDTH + CARD_GAP) * index,
    index,
  }), [])

  if (allEvents.length === 0) return null

  const events = allEvents.slice(0, visibleCount)

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Trending in {profile?.city ?? 'your city'}</Text>
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={s.list}
        onEndReachedThreshold={0.5}
        onEndReached={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, allEvents.length))}
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
})

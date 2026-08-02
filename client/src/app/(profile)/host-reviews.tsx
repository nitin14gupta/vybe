import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ChevronDown, Star } from 'lucide-react-native'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import { BrandedLoader, SortSheet } from '@/components/ui'
import { StarRow, RatingDistribution, RatingFilterRow, ReviewCard } from '@/components/reviews/ReviewParts'
import { EventPerformanceSection } from '@/components/reviews/HostAnalytics'
import { useAuthStore } from '@/store/auth'
import ApiService, { type HostReviewItem, type HostReviewEvent } from '@/api/apiService'

const PAGE_SIZE = 10

export default function HostReviewsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const isOwnProfile = useAuthStore(s => s.userId) === id

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [events, setEvents] = useState<HostReviewEvent[]>([])
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [activeRating, setActiveRating] = useState<number | null>(null)
  const [reviews, setReviews] = useState<HostReviewItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [eventSheetOpen, setEventSheetOpen] = useState(false)

  const fetchFirstPage = useCallback((isRefresh: boolean) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    ApiService.getHostReviews(id, { eventId: activeEventId, rating: activeRating, limit: PAGE_SIZE, offset: 0 })
      .then(res => {
        setAvgRating(res.avg_rating)
        setCount(res.count)
        setDistribution(res.distribution)
        setReviews(res.reviews)
        setHasMore(res.reviews.length === PAGE_SIZE)
        setEvents(res.events)
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [id, activeEventId, activeRating])

  useEffect(() => { fetchFirstPage(false) }, [id, activeEventId, activeRating])

  const loadMore = useCallback(() => {
    if (!id || loadingMore || !hasMore) return
    setLoadingMore(true)
    ApiService.getHostReviews(id, { eventId: activeEventId, rating: activeRating, limit: PAGE_SIZE, offset: reviews.length })
      .then(res => {
        setReviews(prev => [...prev, ...res.reviews])
        setHasMore(res.reviews.length === PAGE_SIZE)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [id, activeEventId, activeRating, loadingMore, hasMore, reviews.length])

  const activeEventTitle = activeEventId ? events.find(e => e.id === activeEventId)?.title : null

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{name ? `${name}'s Reviews` : 'Host Reviews'}</Text>
        <View style={s.iconBtn} />
      </View>

      {loading && reviews.length === 0 ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : count === 0 && !activeEventId && !activeRating ? (
        <View style={s.center}>
          <Star size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySub}>Reviews appear here once attendees rate their events.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={r => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchFirstPage(true)} tintColor={Colors.brandOrange} colors={[Colors.brandOrange]} />
          }
          ListHeaderComponent={
            <View>
              <View style={s.summary}>
                <View style={s.summaryTop}>
                  <View style={s.summaryLeft}>
                    <Text style={s.avg}>{avgRating?.toFixed(1) ?? '—'}</Text>
                    <StarRow rating={Math.round(avgRating ?? 0)} />
                    <Text style={s.countText}>{count} {count === 1 ? 'review' : 'reviews'}</Text>
                  </View>
                  <RatingDistribution distribution={distribution} total={count} />
                </View>
              </View>

              {isOwnProfile && (
                <EventPerformanceSection events={events} activeEventId={activeEventId} onSelect={setActiveEventId} />
              )}

              {isOwnProfile && events.length > 1 && (
                <Pressable style={s.eventFilterBtn} onPress={() => setEventSheetOpen(true)}>
                  <Text style={s.eventFilterLabel} numberOfLines={1}>
                    {activeEventTitle ?? 'All events'}
                  </Text>
                  <ChevronDown size={16} color={Colors.inkSecondary} strokeWidth={2} />
                </Pressable>
              )}

              <RatingFilterRow activeRating={activeRating} onSelect={setActiveRating} distribution={distribution} />

              <Text style={s.whatPeopleSay}>What people say</Text>
            </View>
          }
          renderItem={({ item }) => <ReviewCard item={item} subtitle={item.event_title} eventId={item.event_id} />}
          ListEmptyComponent={
            !loading ? (
              <View style={s.filteredEmpty}>
                <Text style={s.emptySub}>
                  {activeRating ? `No ${activeRating}-star reviews${activeEventId ? ' for this event' : ''} yet.` : 'No reviews for this event yet.'}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={loadingMore ? (
            <View style={s.footerLoader}>
              <ActivityIndicator color={Colors.brandOrange} />
            </View>
          ) : null}
        />
      )}

      {isOwnProfile && (
        <SortSheet
          visible={eventSheetOpen}
          title="Filter by event"
          options={[{ key: 'all', label: 'All events' }, ...events.map(ev => ({ key: ev.id, label: ev.title }))]}
          selected={activeEventId ?? 'all'}
          onSelect={key => setActiveEventId(key === 'all' ? null : key)}
          onClose={() => setEventSheetOpen(false)}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  summary: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  summaryLeft: {
    alignItems: 'flex-start',
    gap: 4,
  },
  avg: {
    fontFamily: FontFamily.headingBold,
    fontSize: 44,
    color: Colors.inkPrimary,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  countText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  whatPeopleSay: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    paddingHorizontal: Spacing.screenPadding,
    marginTop: 4,
    marginBottom: 16,
  },

  eventFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.card,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  eventFilterLabel: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  filteredEmpty: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 20,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
})

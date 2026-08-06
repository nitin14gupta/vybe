import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { Colors, FontFamily, Spacing } from '@/constants'
import { BrandedLoader, SortSheet, BrandedRefreshControl } from '@/components/ui'
import { ReviewCard } from '@/components/reviews/ReviewParts'
import { HostReviewsSummary } from '@/components/reviews/HostReviewsSummary'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import ApiService, { type HostReviewItem, type HostReviewEvent } from '@/api/apiService'

const PAGE_SIZE = 10

export default function HostReviewsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const isOwnProfile = useAuthStore(s => s.userId) === id
  const showPill = usePillStore(s => s.show)

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
      .catch((e: any) => showPill(e?.message || 'Could not load reviews', 'error'))
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
      .catch((e: any) => showPill(e?.message || 'Could not load more reviews', 'error'))
      .finally(() => setLoadingMore(false))
  }, [id, activeEventId, activeRating, loadingMore, hasMore, reviews.length])

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
            <BrandedRefreshControl refreshing={refreshing} onRefresh={() => fetchFirstPage(true)} />
          }
          ListHeaderComponent={
            <HostReviewsSummary
              avgRating={avgRating}
              count={count}
              distribution={distribution}
              events={events}
              isOwnProfile={isOwnProfile}
              activeEventId={activeEventId}
              activeRating={activeRating}
              onSelectEvent={setActiveEventId}
              onSelectRating={setActiveRating}
              onOpenEventSheet={() => setEventSheetOpen(true)}
            />
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

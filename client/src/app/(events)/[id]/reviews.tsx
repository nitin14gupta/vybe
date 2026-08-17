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
import { BrandedLoader, BrandedRefreshControl } from '@/components/ui'
import { StarRow, RatingDistribution, RatingFilterRow, ReviewCard } from '@/components/reviews/ReviewParts'
import ApiService, { type ReviewItem } from '@/api/apiService'

const PAGE_SIZE = 10

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [activeRating, setActiveRating] = useState<number | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [hasMore, setHasMore] = useState(true)

  const fetchFirstPage = useCallback((isRefresh: boolean) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    ApiService.getEventReviews(id, { rating: activeRating, limit: PAGE_SIZE, offset: 0 })
      .then(res => {
        setLoadError(false)
        setAvgRating(res.avg_rating)
        setCount(res.count)
        setDistribution(res.distribution)
        setReviews(res.reviews)
        setHasMore(res.reviews.length === PAGE_SIZE)
      })
      .catch(() => setLoadError(true))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [id, activeRating])

  useEffect(() => { fetchFirstPage(false) }, [id, activeRating])

  const loadMore = useCallback(() => {
    if (!id || loadingMore || !hasMore) return
    setLoadingMore(true)
    ApiService.getEventReviews(id, { rating: activeRating, limit: PAGE_SIZE, offset: reviews.length })
      .then(res => {
        setReviews(prev => [...prev, ...res.reviews])
        setHasMore(res.reviews.length === PAGE_SIZE)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [id, activeRating, loadingMore, hasMore, reviews.length])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
        <Text style={s.title}>Reviews</Text>
        <View style={s.iconBtn} />
      </View>

      {loading && reviews.length === 0 ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : loadError && reviews.length === 0 ? (
        <View style={s.center}>
          <Star size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Couldn't load reviews</Text>
          <Text style={s.emptySub}>Something went wrong.</Text>
          <Pressable style={s.retryBtn} onPress={() => fetchFirstPage(false)}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : count === 0 && !activeRating ? (
        <View style={s.center}>
          <Star size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySub}>Reviews appear here once attendees rate the event.</Text>
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
              <RatingFilterRow activeRating={activeRating} onSelect={setActiveRating} distribution={distribution} />
              <Text style={s.whatPeopleSay}>What people say</Text>
            </View>
          }
          renderItem={({ item }) => <ReviewCard item={item} />}
          ListEmptyComponent={
            !loading ? (
              <View style={s.filteredEmpty}>
                <Text style={s.emptySub}>No {activeRating}-star reviews yet.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={loadingMore ? (
            <View style={s.footerLoader}>
              <ActivityIndicator color={Colors.inkSecondary} />
            </View>
          ) : null}
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
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  summary: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 20,
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
    marginBottom: 16,
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
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
})

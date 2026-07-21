import React, { useEffect, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import { BrandedLoader } from '@/components/ui'
import ApiService, { type ReviewItem } from '@/api/apiService'

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={13}
          color={Colors.brandOrange}
          fill={n <= rating ? Colors.brandOrange : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  )
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const initials = (item.reviewer_name ?? '?').charAt(0).toUpperCase()
  const date = new Date(item.created_at.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  const dateStr = isNaN(date.getTime()) ? '' : date.toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <View style={c.card}>
      <View style={c.cardTop}>
        <View style={c.avatar}>
          {item.reviewer_avatar ? (
            <Image source={{ uri: item.reviewer_avatar }} style={c.avatarImg} contentFit="cover" />
          ) : (
            <Text style={c.avatarInit}>{initials}</Text>
          )}
        </View>
        <View style={c.cardMeta}>
          <Text style={c.name} numberOfLines={1}>{item.reviewer_name ?? 'Anonymous'}</Text>
          <View style={c.ratingRow}>
            <StarRow rating={item.rating} />
            {dateStr ? <Text style={c.date}>{dateStr}</Text> : null}
          </View>
        </View>
      </View>
      {item.body ? <Text style={c.body}>{item.body}</Text> : null}
    </View>
  )
}

const c = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    gap: 10,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInit: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  cardMeta: { flex: 1, gap: 4 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 21 },
})

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [reviews, setReviews] = useState<ReviewItem[]>([])

  useEffect(() => {
    if (!id) return
    ApiService.getEventReviews(id)
      .then(res => {
        setAvgRating(res.avg_rating)
        setCount(res.count)
        setReviews(res.reviews)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

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

      {loading ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : count === 0 ? (
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
          ListHeaderComponent={
            <View style={s.summary}>
              <Text style={s.avg}>{avgRating?.toFixed(1) ?? '—'}</Text>
              <StarRow rating={Math.round(avgRating ?? 0)} />
              <Text style={s.countText}>{count} {count === 1 ? 'review' : 'reviews'}</Text>
            </View>
          }
          renderItem={({ item }) => <ReviewCard item={item} />}
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
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  avg: {
    fontFamily: FontFamily.headingBold,
    fontSize: 52,
    color: Colors.inkPrimary,
    letterSpacing: -2,
    lineHeight: 58,
  },
  countText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: 4,
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

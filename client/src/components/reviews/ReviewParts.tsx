import React, { memo, useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import ReanimatedView, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Star } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import { useAuthStore } from '@/store/auth'
import type { ReviewItem } from '@/api/apiService'

export const StarRow = memo(function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          color={Colors.brandOrange}
          fill={n <= rating ? Colors.brandOrange : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  )
})

function DistBar({ pct, delay }: { pct: number; delay: number }) {
  const width = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 500,
      delay,
      useNativeDriver: false,
    }).start()
  }, [pct])

  return (
    <View style={c.distTrack}>
      <Animated.View
        style={[
          c.distFill,
          { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  )
}

export function RatingDistribution({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  return (
    <View style={c.distWrap}>
      {[5, 4, 3, 2, 1].map((n, i) => {
        const count = distribution[String(n)] ?? 0
        const pct = total > 0 ? count / total : 0
        return (
          <View key={n} style={c.distRow}>
            <DistBar pct={pct} delay={i * 60} />
            <Text style={c.distLabel}>{n}</Text>
          </View>
        )
      })}
    </View>
  )
}

const AnimatedPressable = ReanimatedView.createAnimatedComponent(Pressable)

function FilterChip({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      style={[c.filterChip, active && c.filterChipActive, pressStyle]}
      onPress={onPress}
      onPressIn={() => { pressScale.value = withSpring(0.95, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
    >
      {children}
    </AnimatedPressable>
  )
}

export function RatingFilterRow({
  activeRating,
  onSelect,
  distribution,
}: {
  activeRating: number | null
  onSelect: (rating: number | null) => void
  distribution?: Record<string, number>
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={c.filterRow}>
      <FilterChip active={activeRating === null} onPress={() => onSelect(null)}>
        <Text style={[c.filterChipText, activeRating === null && c.filterChipTextActive]}>All ratings</Text>
      </FilterChip>
      {[5, 4, 3, 2, 1].map(n => {
        const isActive = activeRating === n
        const count = distribution?.[String(n)]
        return (
          <FilterChip key={n} active={isActive} onPress={() => onSelect(n)}>
            <Star size={12} color={isActive ? Colors.background : Colors.brandOrange} fill={isActive ? Colors.background : Colors.brandOrange} strokeWidth={0} />
            <Text style={[c.filterChipText, isActive && c.filterChipTextActive]}>
              {n}{count != null ? ` (${count})` : ''}
            </Text>
          </FilterChip>
        )
      })}
    </ScrollView>
  )
}

export const ReviewCard = memo(function ReviewCard({
  item,
  subtitle,
  eventId,
}: {
  item: ReviewItem
  subtitle?: string | null
  eventId?: string | null
}) {
  const initials = (item.reviewer_name ?? '?').charAt(0).toUpperCase()
  const dateStr = useMemo(() => {
    const date = new Date(item.created_at.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }, [item.created_at])

  const goToReviewer = () => {
    const myId = useAuthStore.getState().userId
    if (item.reviewer_id === myId) {
      router.push('/(tabs)/profile')
    } else {
      router.push(`/(profile)/${item.reviewer_id}` as any)
    }
  }

  const goToEvent = () => {
    if (eventId) router.push(`/(events)/${eventId}` as any)
  }

  const topPressScale = useSharedValue(1)
  const topPressStyle = useAnimatedStyle(() => ({ transform: [{ scale: topPressScale.value }] }))
  const subtitlePressScale = useSharedValue(1)
  const subtitlePressStyle = useAnimatedStyle(() => ({ transform: [{ scale: subtitlePressScale.value }] }))

  return (
    <View style={c.card}>
      <AnimatedPressable
        style={[c.cardTop, topPressStyle]}
        onPress={goToReviewer}
        hitSlop={4}
        onPressIn={() => { topPressScale.value = withSpring(0.985, { duration: 120 }) }}
        onPressOut={() => { topPressScale.value = withSpring(1, { duration: 120 }) }}
      >
        <View style={c.avatar}>
          {item.reviewer_avatar ? (
            <Image
              source={{ uri: item.reviewer_avatar }}
              style={c.avatarImg}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="low"
              transition={150}
            />
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
      </AnimatedPressable>
      {subtitle ? (
        <AnimatedPressable
          onPress={goToEvent}
          hitSlop={4}
          disabled={!eventId}
          style={[c.subtitleRow, subtitlePressStyle]}
          onPressIn={() => { if (eventId) subtitlePressScale.value = withSpring(0.95, { duration: 120 }) }}
          onPressOut={() => { subtitlePressScale.value = withSpring(1, { duration: 120 }) }}
        >
          <Text style={c.subtitle} numberOfLines={1}>{subtitle}</Text>
        </AnimatedPressable>
      ) : null}
      {item.body ? <Text style={c.body}>{item.body}</Text> : null}
    </View>
  )
})

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
  distWrap: { flex: 1, gap: 6, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.inkPrimary,
  },
  distLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkSecondary,
    width: 10,
    textAlign: 'right',
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
  subtitleRow: { marginTop: -4, alignSelf: 'flex-start' },
  subtitle: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 21 },

  filterRow: {
    gap: 8,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    maxWidth: 180,
  },
  filterChipActive: {
    backgroundColor: Colors.brandOrange,
    borderColor: Colors.brandOrange,
  },
  filterChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  filterChipTextActive: {
    color: Colors.background,
  },
})

import { Pressable, View, Text, StyleSheet, Image } from 'react-native'
import { router } from 'expo-router'
import { MapPin, ChevronRight, Calendar } from 'lucide-react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily, Radius } from '@/constants'
import { formatEventDate } from '@/components/events/EventCard'
import type { EventSummary } from '@/api/apiService'

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}
export function EventListCard({ event }: { event: EventSummary }) {
  const cover = event.cover_photos?.[0]?.url

  return (
    <Pressable style={s.row} onPress={() => router.push(`/(events)/${event.id}` as any)}>
      <View style={s.thumb}>
        {cover ? (
          <Image source={{ uri: cover }} style={s.thumbImg} resizeMode="cover" />
        ) : (
          <View style={[s.thumbImg, s.thumbFallback]}>
            <Text style={s.thumbEmoji}>{EVENT_EMOJIS[event.event_type] ?? '🔥'}</Text>
          </View>
        )}
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>{event.title}</Text>
        <View style={s.timeRow}>
          <Calendar size={12} color={Colors.brandOrange} strokeWidth={2.2} />
          <Text style={s.time} numberOfLines={1}>{formatEventDate(event.date_time)}</Text>
        </View>
        {event.location_name ? (
          <View style={s.locRow}>
            <MapPin size={12} color={Colors.inkDisabled} strokeWidth={2} />
            <Text style={s.loc} numberOfLines={1}>{event.location_name}</Text>
          </View>
        ) : null}
      </View>

      <View style={s.chevronWrap}>
        <ChevronRight size={16} color={Colors.inkSecondary} strokeWidth={2.2} />
      </View>
    </Pressable>
  )
}

// Same shape as the real row, shimmering — shown while events are still
// loading.
export function EventListCardSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={16} gradientColors={['#1e1e1e', '#2e2e2e']}>
      <View style={s.row}>
        <View style={[s.thumb, s.skBlock]} />
        <View style={s.info}>
          <View style={[s.skLine, { width: '70%', height: 15 }]} />
          <View style={[s.skLine, { width: '45%', height: 11 }]} />
          <View style={[s.skLine, { width: '55%', height: 11 }]} />
        </View>
      </View>
    </AutoSkeletonView>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.card + 8,
    backgroundColor: Colors.surface,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // Fixed width+height (16:9) instead of `aspectRatio` — that style prop is
  // unreliable across RN/Yoga versions paired with a fixed width and no
  // explicit height.
  thumb: { width: 120, height: 68, borderRadius: 14, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 26 },

  info: { flex: 1, minWidth: 0, gap: 5 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandOrange },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  loc: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, flexShrink: 1 },

  chevronWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  skBlock: { backgroundColor: '#2a2a2a' },
  skLine: { borderRadius: 5, backgroundColor: '#2a2a2a' },
})

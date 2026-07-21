import { Pressable, View, Text, StyleSheet, Image } from 'react-native'
import { router } from 'expo-router'
import { MapPin, ChevronRight } from 'lucide-react-native'
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

// Full-width list row (16:9 thumbnail + title/time/location + chevron), used
// by the Calendar screen's day panel. `style` on the outer Pressable must
// stay a plain object/array, NOT a `({pressed}) => [...]` function — that
// form silently failed to apply in this app's RN setup (children fell back
// to View defaults: column direction, full-width stretch) even though every
// other Pressable using a plain style renders fine. Cost a long debugging
// loop to pin down, so: don't reintroduce it here.
export function DayEventRow({ event }: { event: EventSummary }) {
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
        <Text style={s.time} numberOfLines={1}>{formatEventDate(event.date_time)}</Text>
        {event.location_name ? (
          <View style={s.locRow}>
            <MapPin size={11} color={Colors.inkDisabled} strokeWidth={2} />
            <Text style={s.loc} numberOfLines={1}>{event.location_name}</Text>
          </View>
        ) : null}
      </View>

      <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />
    </Pressable>
  )
}

// Same shape as the real row, shimmering — shown while joined/hosted events
// are still loading.
export function DayEventRowSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={14} gradientColors={['#1e1e1e', '#2e2e2e']}>
      <View style={s.row}>
        <View style={[s.thumb, s.skBlock]} />
        <View style={s.info}>
          <View style={[s.skLine, { width: '70%', height: 14 }]} />
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
    gap: 12,
    borderRadius: Radius.card + 4,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.elevated,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  // Fixed width+height (16:9) instead of `aspectRatio` — that style prop is
  // unreliable across RN/Yoga versions paired with a fixed width and no
  // explicit height.
  thumb: { width: 100, height: 56, borderRadius: 10, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 22 },

  info: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  time: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.brandOrange },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loc: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, flexShrink: 1 },

  skBlock: { backgroundColor: '#2a2a2a' },
  skLine: { borderRadius: 5, backgroundColor: '#2a2a2a' },
})

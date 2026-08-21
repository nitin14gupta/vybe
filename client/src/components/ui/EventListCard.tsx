import { memo } from 'react'
import { Pressable, View, Text, StyleSheet } from 'react-native'
import { Image, type ImageProps } from 'expo-image'
import { router } from 'expo-router'
import { MapPin, ChevronRight, Calendar } from 'lucide-react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily, Radius, EVENT_ICONS, EVENT_ICON_FALLBACK, withOpacity } from '@/constants'
import { formatEventDate, AttendeeAvatarStack } from '@/components/events/EventCard'
import { HotlistButton } from '@/components/events/HotlistButton'
import { SosButton } from '@/components/events/SosButton'
import { isEventPast } from '@/lib/dates'
import type { EventSummary } from '@/api/apiService'

function formatPrice(price: number, isFree: boolean) {
  if (isFree) return 'Free'
  if (price >= 1000) return '₹' + (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + 'k'
  return '₹' + price
}

function EventListCardBase({
  event,
  onPress,
  showHotlist = true,
  showSos = false,
  priority = 'normal',
}: {
  event: EventSummary
  onPress?: () => void
  /** Set false to hide the save/hotlist toggle — e.g. Recently Viewed. */
  showHotlist?: boolean
  /** Only pass true for an event that's actually happening right now (isEventActive) — e.g. the calendar's GOING rows. */
  showSos?: boolean
  priority?: ImageProps['priority']
}) {
  const cover = event.cover_photos?.[0]?.url
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK

  return (
    <View style={s.rowWrap}>
    <Pressable style={s.row} onPress={onPress ?? (() => router.push(`/(events)/${event.id}` as any))}>
      <View style={s.thumb}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={s.thumbImg}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            priority={priority}
          />
        ) : (
          <View style={[s.thumbImg, s.thumbFallback]}>
            <TypeIcon size={22} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
        {event.host_name && !event.host_is_deleted ? (
          event.host_avatar ? (
            <Image
              source={{ uri: event.host_avatar }}
              style={s.hostBadge}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={[s.hostBadge, s.hostBadgeFallback]}>
              <Text style={s.hostInitial}>{event.host_name.charAt(0).toUpperCase()}</Text>
            </View>
          )
        ) : null}
        <View style={[s.priceBadge, event.is_free && s.priceBadgeFree]}>
          <Text style={s.priceText}>{formatPrice(event.price_inr, event.is_free)}</Text>
        </View>
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>{event.title}</Text>
        <View style={s.timeRow}>
          <Calendar size={12} color={Colors.inkSecondary} strokeWidth={2.2} />
          <Text style={s.time} numberOfLines={1}>{formatEventDate(event.date_time)}</Text>
        </View>
        {event.location_name ? (
          <View style={s.locRow}>
            <MapPin size={12} color={Colors.inkDisabled} strokeWidth={2} />
            <Text style={s.loc} numberOfLines={1}>{event.location_name}</Text>
          </View>
        ) : null}
        {event.attendee_count > 0 && (
          <AttendeeAvatarStack
            avatars={event.attendee_avatars}
            count={event.attendee_count}
            avatarSize={15}
            textStyle={s.going}
          />
        )}
      </View>

      <View style={s.chevronWrap}>
        <ChevronRight size={16} color={Colors.inkSecondary} strokeWidth={2.2} />
      </View>
    </Pressable>

    {/* Siblings of the row's own Pressable above, not nested inside it —
        same reasoning as HostPill in EventCard.tsx: a nested touchable
        breaks both the tap and the child's own background rendering on
        Android. */}
    {showHotlist && !isEventPast(event) && (
      <HotlistButton eventId={event.id} initial={event.is_hotlisted} style={s.hotlistBtn} size={13} />
    )}
    {showSos && !isEventPast(event) && (
      <SosButton eventId={event.id} style={s.sosBtn} />
    )}
    </View>
  )
}

export const EventListCard = memo(EventListCardBase)

// Same shape as the real row, shimmering — shown while events are still
// loading.
// Own transparent wrapper (not the real row's s.row, which carries a solid
// backgroundColor) — AutoSkeletonView treats any child with a background as
// a bone, so a filled container swallows the thumb/lines into one blob.
export function EventListCardSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={16} gradientColors={[Colors.skeletonBase, Colors.skeletonHighlight]}>
      <View style={s.skRow}>
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
  rowWrap: { position: 'relative' },
  skRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.card + 8,
    padding: 12,
  },
  hotlistBtn: {
    position: 'absolute', top: 17, left: 105,
    width: 22, height: 22, borderRadius: 11,
  },
  sosBtn: {
    position: 'absolute', top: 16, left: 102,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.card + 8,
    backgroundColor: Colors.surface,
    padding: 12,
    shadowColor: Colors.background,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  thumb: { width: 120, height: 68, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hostBadge: {
    position: 'absolute', top: 5, left: 5,
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 0.5, borderColor: withOpacity(Colors.inkPrimary, 0.85),
  },
  hostBadgeFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hostInitial: { fontFamily: FontFamily.headingBold, fontSize: 9, color: Colors.inkPrimary },
  priceBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: Colors.brandOrange,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  priceBadgeFree: { backgroundColor: Colors.accentGreen },
  priceText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.inkPrimary },

  info: { flex: 1, minWidth: 0, gap: 5 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  loc: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, flexShrink: 1 },
  going: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.inkDisabled, marginLeft: 4 },

  chevronWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    alignItems: 'center', justifyContent: 'center',
  },

  skBlock: { backgroundColor: Colors.surfaceMuted },
  skLine: { borderRadius: 5, backgroundColor: Colors.surfaceMuted },
})

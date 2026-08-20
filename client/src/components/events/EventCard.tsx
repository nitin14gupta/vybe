import { Fragment, memo, useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { MapPin, Flame } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily, EVENT_ICONS, EVENT_ICON_FALLBACK, withOpacity } from '@/constants'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { hSelection } from '@/lib/haptics'
import { useAuthStore } from '@/store/auth'
import { HotlistButton } from './HotlistButton'
import { EventQuickPeekSheet } from './EventQuickPeekSheet'
import type { EventSummary } from '@/api/apiService'

const StaggerIn = memo(function StaggerIn({ index, style, children }: { index: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.6)

  useEffect(() => {
    opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 }))
    scale.value = withDelay(index * 35, withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }))

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
})

// Stacked avatars (up to 3) + "+N" overflow badge + "{count} going" label,
// each staggering in on mount. Shared by EventCard's grid layout and
// EventListCard's compact row so both list modes show the same social proof.
export function AttendeeAvatarStack({
  avatars,
  count,
  avatarSize = 18,
  style,
  textStyle,
}: {
  avatars: string[] | undefined
  count: number
  avatarSize?: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}) {
  const avatarStyle = { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
  const overlap = -(avatarSize * 0.44)

  return (
    <View style={[aas.row, style]}>
      {avatars?.slice(0, 3).map((url, i) => (
        <StaggerIn key={url + i} index={i} style={[i > 0 && { marginLeft: overlap }, { zIndex: i }]}>
          <Image
            source={{ uri: url }}
            style={[aas.avatar, avatarStyle]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        </StaggerIn>
      ))}
      {count > 3 && (
        <StaggerIn index={3} style={{ marginLeft: overlap, zIndex: 3 }}>
          <View style={[aas.avatar, avatarStyle, aas.avatarMore]}>
            <Text style={aas.avatarMoreText}>+{count - 3}</Text>
          </View>
        </StaggerIn>
      )}
      <Text style={[aas.going, textStyle]}>{count} going</Text>
    </View>
  )
}

const aas = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    borderWidth: 1.5, borderColor: Colors.surface,
    backgroundColor: Colors.surfaceMuted,
  },
  avatarMore: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.elevated,
  },
  avatarMoreText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 8,
    color: Colors.inkSecondary,
  },
  going: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginLeft: 4 },
})

export function HostPill({
  name,
  avatar,
  compact,
  style,
}: {
  name: string
  avatar: string | null
  compact?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[hp.pill, compact && hp.pillCompact, style]}>
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={[hp.avatar, compact && hp.avatarCompact]}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="low"
          transition={150}
        />
      ) : (
        <View style={[hp.avatar, compact && hp.avatarCompact, hp.avatarFallback]}>
          <Text style={[hp.initial, compact && hp.initialCompact]}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={[hp.text, compact && hp.textCompact]} numberOfLines={1}>{name}</Text>
    </View>
  )
}

const hp = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRadius: 20, paddingLeft: 4, paddingRight: 10, paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withOpacity(Colors.inkPrimary, 0.12),
    shadowColor: Colors.background,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pillCompact: {
    gap: 5, borderRadius: 16, paddingLeft: 3, paddingRight: 8, paddingVertical: 3,
  },
  avatar: { width: 20, height: 20, borderRadius: 10 },
  avatarCompact: { width: 16, height: 16, borderRadius: 8 },
  avatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 11, color: Colors.inkPrimary },
  initialCompact: { fontSize: 9 },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },
  textCompact: { fontSize: 10 },
})

export function formatEventDate(iso: string | null | undefined) {
  const d = parseServerDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPrice(price: number, isFree: boolean) {
  return isFree ? 'Free' : `₹${price}`
}

// The one place that owns what a price badge looks like — same reasoning as
// HostPill above: callers (EventCard, the map-mode preview strip) position
// it themselves via `style`, but never hand-roll their own bg/text colors.
export function PriceBadge({
  price,
  isFree,
  compact,
  style,
}: {
  price: number
  isFree: boolean
  compact?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[pb.badge, compact && pb.badgeCompact, isFree && pb.badgeFree, style]}>
      <Text style={[pb.text, compact && pb.textCompact]}>{formatPrice(price, isFree)}</Text>
    </View>
  )
}

const pb = StyleSheet.create({
  badge: { backgroundColor: Colors.brandOrange, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCompact: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  badgeFree: { backgroundColor: Colors.accentGreen },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  textCompact: { fontSize: 12 },
})

interface Props {
  event: EventSummary
  onPress: () => void
  /** Show host name below title (for joined-events) */
  showHost?: boolean
  /** Dim card and show Past badge */
  isPast?: boolean
  /** Show Cancelled badge */
  isCancelled?: boolean
  /** Optional tappable strip rendered at the bottom of the card (e.g. "View Ticket", "View Reviews") */
  footer?: ReactNode
}

export const EventCard = memo(function EventCard({ event, onPress, showHost, isPast, isCancelled, footer }: Props) {
  const router = useRouter()
  const myId = useAuthStore(state => state.userId)
  const [peekOpen, setPeekOpen] = useState(false)
  const cover = event.cover_photos?.[0]?.url
  const spotsLow = event.spots_left > 0 && event.spots_left <= 10
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK

  const canOpenHost = !!event.host_id && event.host_name && !event.host_is_deleted
  // Don't offer hotlisting an event that's already ended — respects both the
  // explicit `isPast` prop (e.g. Joined Events' Past tab) and the event's
  // own dates, so it's safe even where callers don't pass `isPast`.
  const eventIsPast = isPast || isEventPast(event)

  return (
    <Fragment>
    <View style={isPast && s.cardPast}>
    <Pressable
      style={s.card}
      onPress={onPress}
      onLongPress={() => { hSelection(); setPeekOpen(true) }}
      delayLongPress={350}
    >
      {/* 16:9 cover image */}
      <View style={s.imageWrap}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        ) : (
          <LinearGradient colors={[Colors.surface, Colors.deepBackground]} style={[StyleSheet.absoluteFill, s.placeholder]}>
            <TypeIcon size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
          </LinearGradient>
        )}

        {/* Gradient scrim for title legibility */}
        <LinearGradient
          colors={['transparent', withOpacity(Colors.background, 0.78)]}
          style={s.gradient}
          pointerEvents="none"
        />

        <PriceBadge
          price={event.price_inr}
          isFree={event.is_free}
          style={[s.priceBadgePos, eventIsPast && s.priceBadgeNoHotlist]}
        />

        {/* Host pill (display only when not tappable) — avatar + name,
            Partiful-style organizer credit. The tappable version is the
            sibling Pressable rendered after the card below; only one of the
            two ever renders. */}
        {!canOpenHost && event.host_name && !event.host_is_deleted ? (
          <HostPill
            name={event.host_name}
            avatar={event.host_avatar}
            style={s.hostPillPos}
          />
        ) : null}

        {/* Status badges */}
        {isCancelled ? (
          <View style={[s.statusBadge, s.cancelledBadge]}>
            <Text style={s.statusBadgeText}>Cancelled</Text>
          </View>
        ) : isPast ? (
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>Past</Text>
          </View>
        ) : null}

        {/* Title + date overlaid on gradient */}
        <View style={s.cardFooter}>
          <Text style={s.title} numberOfLines={2}>{event.title}</Text>
          {showHost && event.host_name ? (
            <Text style={[s.hostName, event.host_is_deleted && s.hostNameDeleted]} numberOfLines={1}>
              by {event.host_name}
            </Text>
          ) : null}
          <Text style={s.date}>{formatEventDate(event.date_time)}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={s.meta}>
        <View style={s.metaLeft}>
          <View style={s.eventTypeRow}>
            <TypeIcon size={12} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.eventType}>{event.event_type.replace('_', ' ')}</Text>
          </View>
          {event.location_name ? (
            <View style={s.eventTypeRow}>
              <MapPin size={12} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.location} numberOfLines={1}>{event.location_name}</Text>
            </View>
          ) : null}
        </View>
        <View style={s.metaRight}>
          {event.distance_km != null && (
            <Text style={s.dist}>{event.distance_km} km</Text>
          )}
          <AttendeeAvatarStack avatars={event.attendee_avatars} count={event.attendee_count} />
        </View>
      </View>

      {spotsLow && !isPast && !isCancelled && (
        <View style={s.spotsBar}>
          <Flame size={13} color={Colors.inkPrimary} strokeWidth={2} />
          <Text style={s.spotsText}>Only {event.spots_left} spots left</Text>
        </View>
      )}

      {footer}
    </Pressable>

    {/* True siblings of the card's Pressable above, not descendants — see
        the comment on the wrapper View. */}
    {!eventIsPast && (
      <HotlistButton eventId={event.id} initial={event.is_hotlisted} style={s.hotlistBtn} />
    )}
    {canOpenHost && (
      <Pressable
        style={s.hostPillPos}
        onPress={() => {
          hSelection()
          router.push((event.host_id === myId ? '/(tabs)/profile' : `/(profile)/${event.host_id}`) as any)
        }}
      >
        <View pointerEvents="none">
          <HostPill name={event.host_name!} avatar={event.host_avatar} />
        </View>
      </Pressable>
    )}
    </View>
    <EventQuickPeekSheet visible={peekOpen} event={event} onClose={() => setPeekOpen(false)} />
    </Fragment>
  )
})

// Same shape as the real card, shimmering — shown while events are still
// loading. Own transparent wrapper (not the real card's s.card, which
// carries a solid backgroundColor) — AutoSkeletonView treats any child with
// a background as a bone to shimmer, so a filled container gets swallowed
// into one shimmering blob instead of showing the image block + text lines
// as distinct shapes.
export function EventCardSkeleton() {
  return (
    <View style={[s.card, { elevation: 0, shadowOpacity: 0 }]}>
      {/* Static backgrounds so the skeleton maintains the visual card shape */}
      <View style={[s.imageWrap, { backgroundColor: Colors.background }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
        <AutoSkeletonView isLoading animationType="gradient" defaultRadius={20} gradientColors={[Colors.surfaceMuted, '#3a3a3a']}>
          <View style={s.imageWrap}>
            {/* Top Left: Host Pill */}
            <View style={[s.skLine, s.hostPillPos, { width: 120, height: 28, borderRadius: 14 }]} />
            
            {/* Top Right: Hotlist & Price */}
            <View style={[s.skLine, s.hotlistBtn]} />
            <View style={[s.skLine, s.priceBadge, { width: 50, height: 24, borderRadius: 10 }]} />
            
            {/* Bottom: Title & Date */}
            <View style={s.cardFooter}>
              <View style={[s.skLine, { width: '75%', height: 18, marginBottom: 8 }]} />
              <View style={[s.skLine, { width: '45%', height: 14 }]} />
            </View>
          </View>
          <View style={s.meta}>
            <View style={s.metaLeft}>
              <View style={[s.skLine, { width: '45%', height: 12 }]} />
              <View style={[s.skLine, { width: '65%', height: 12, marginTop: 6 }]} />
            </View>
            <View style={s.metaRight}>
              <View style={[s.skLine, { width: 54, height: 11 }]} />
            </View>
          </View>
        </AutoSkeletonView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.background,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  cardPast: { opacity: 0.65 },

  imageWrap: { width: '100%', aspectRatio: 16 / 9, position: 'relative', overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 130 },

  hotlistBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(10,10,10,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Position only — PriceBadge (exported above) owns the badge's own look.
  priceBadgePos: { position: 'absolute', top: 12, right: 50 },
  // Kept for the skeleton's placeholder block below, which needs the same
  // top/right slot but sizes/colors itself independently.
  priceBadge: { position: 'absolute', top: 12, right: 50 },
  // Past events hide the hotlist button — slide the price over into that
  // now-empty slot instead of leaving a gap.
  priceBadgeNoHotlist: { right: 12 },

  hostPillPos: {
    position: 'absolute', top: 12, left: 12,
    maxWidth: '65%',
  },

  // Sits below the host pill (top:12 + ~28px height + gap) rather than
  // sharing its corner — Cancelled/Past events still show who hosted them.
  statusBadge: {
    position: 'absolute', top: 50, left: 12,
    backgroundColor: withOpacity(Colors.background, 0.85),
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  cancelledBadge: { backgroundColor: withOpacity(Colors.destructive, 0.85) },
  statusBadgeText: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkPrimary },

  cardFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, lineHeight: 21 },
  hostName: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(Colors.inkPrimary, 0.75), marginTop: 2 },
  hostNameDeleted: { color: withOpacity(Colors.inkPrimary, 0.4) },
  date: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: withOpacity(Colors.inkPrimary, 0.75), marginTop: 3 },

  meta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  metaLeft: { flex: 1, gap: 3 },
  metaRight: { alignItems: 'flex-end', gap: 3 },
  eventTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventType: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, textTransform: 'capitalize' },
  location: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  dist: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },

  spotsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  spotsText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkPrimary },

  skCard: { borderRadius: 20, overflow: 'hidden' },
  skBlock: { backgroundColor: Colors.surfaceMuted },
  skLine: { borderRadius: 5, backgroundColor: Colors.surfaceMuted },
})
import { Fragment, memo, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { MapPin, Flame } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily, EVENT_ICONS, EVENT_ICON_FALLBACK } from '@/constants'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { hSelection } from '@/lib/haptics'
import { useAuthStore } from '@/store/auth'
import { HotlistButton } from './HotlistButton'
import { EventQuickPeekSheet } from './EventQuickPeekSheet'
import type { EventSummary } from '@/api/apiService'

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
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
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
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 11, color: '#fff' },
  initialCompact: { fontSize: 9 },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: '#fff' },
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

function formatPrice(price: number, isFree: boolean) {
  return isFree ? 'Free' : `₹${price}`
}

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
          <LinearGradient colors={['#1a1a1a', '#0d0d0d']} style={[StyleSheet.absoluteFill, s.placeholder]}>
            <TypeIcon size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
          </LinearGradient>
        )}

        {/* Gradient scrim for title legibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          style={s.gradient}
          pointerEvents="none"
        />

        <View style={[s.priceBadge, eventIsPast && s.priceBadgeNoHotlist, event.is_free && s.priceBadgeFree]}>
          <Text style={s.priceText}>{formatPrice(event.price_inr, event.is_free)}</Text>
        </View>

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
          <View style={s.attendeesRow}>
            {event.attendee_avatars?.slice(0, 3).map((url, i) => (
              <Image
                key={url + i}
                source={{ uri: url }}
                style={[s.stackAvatar, i > 0 && { marginLeft: -8 }, { zIndex: 3 - i }]}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="low"
                transition={150}
              />
            ))}
            {event.attendee_count > 3 && (
              <View style={[s.stackAvatar, s.stackAvatarMore, { marginLeft: -8, zIndex: 0 }]}>
                <Text style={s.stackAvatarMoreText}>+{event.attendee_count - 3}</Text>
              </View>
            )}
            <Text style={s.attendees}>{event.attendee_count} going</Text>
          </View>
        </View>
      </View>

      {spotsLow && !isPast && !isCancelled && (
        <View style={s.spotsBar}>
          <Flame size={13} color={Colors.brandOrange} strokeWidth={2} />
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
      <View style={[s.imageWrap, { backgroundColor: '#111' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
        <AutoSkeletonView isLoading animationType="gradient" defaultRadius={20} gradientColors={['#2a2a2a', '#3a3a3a']}>
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
    shadowColor: '#000',
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
  priceBadge: {
    position: 'absolute', top: 12, right: 50,
    backgroundColor: Colors.brandOrange,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  // Past events hide the hotlist button — slide the price over into that
  // now-empty slot instead of leaving a gap.
  priceBadgeNoHotlist: { right: 12 },
  priceBadgeFree: { backgroundColor: Colors.accentGreen },
  priceText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#fff' },

  hostPillPos: {
    position: 'absolute', top: 12, left: 12,
    maxWidth: '65%',
  },

  // Sits below the host pill (top:12 + ~28px height + gap) rather than
  // sharing its corner — Cancelled/Past events still show who hosted them.
  statusBadge: {
    position: 'absolute', top: 50, left: 12,
    backgroundColor: 'rgba(17,17,17,0.85)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  cancelledBadge: { backgroundColor: 'rgba(255,56,100,0.85)' },
  statusBadgeText: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: '#fff' },

  cardFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: '#fff', lineHeight: 21 },
  hostName: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: 'rgba(255,107,53,0.9)', marginTop: 2 },
  hostNameDeleted: { color: 'rgba(255,255,255,0.4)' },
  date: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

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
  attendees: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginLeft: 4 },
  attendeesRow: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: Colors.surface,
    backgroundColor: '#2a2a2a',
  },
  stackAvatarMore: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.elevated,
  },
  stackAvatarMoreText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 8,
    color: Colors.inkSecondary,
  },

  spotsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  spotsText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.brandOrange },

  skCard: { borderRadius: 20, overflow: 'hidden' },
  skBlock: { backgroundColor: '#2a2a2a' },
  skLine: { borderRadius: 5, backgroundColor: '#2a2a2a' },
})
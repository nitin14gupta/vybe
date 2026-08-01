import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { MapPin, Flame } from 'lucide-react-native'
import { Colors, FontFamily, EVENT_ICONS, EVENT_ICON_FALLBACK } from '@/constants'
import { parseServerDate } from '@/lib/dates'
import type { EventSummary } from '@/api/apiService'

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

export function EventCard({ event, onPress, showHost, isPast, isCancelled, footer }: Props) {
  const cover = event.cover_photos?.[0]?.url
  const spotsLow = event.spots_left > 0 && event.spots_left <= 10
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK

  return (
    <Pressable style={[s.card, isPast && s.cardPast]} onPress={onPress}>
      {/* 16:9 cover image */}
      <View style={s.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
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

        {/* Price badge */}
        <View style={[s.priceBadge, event.is_free && s.priceBadgeFree]}>
          <Text style={s.priceText}>{formatPrice(event.price_inr, event.is_free)}</Text>
        </View>

        {/* Host pill — avatar + name, Partiful-style organizer credit */}
        {event.host_name && !event.host_is_deleted ? (
          <View style={s.hostPill}>
            {event.host_avatar ? (
              <Image source={{ uri: event.host_avatar }} style={s.hostPillAvatar} />
            ) : (
              <View style={[s.hostPillAvatar, s.hostPillAvatarFallback]}>
                <Text style={s.hostPillInitial}>{event.host_name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={s.hostPillText} numberOfLines={1}>{event.host_name}</Text>
          </View>
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
          <Text style={s.attendees}>{event.attendee_count} going</Text>
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

  priceBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.brandOrange,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  priceBadgeFree: { backgroundColor: Colors.accentGreen },
  priceText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#fff' },

  hostPill: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(17,17,17,0.72)',
    borderRadius: 20, paddingLeft: 4, paddingRight: 10, paddingVertical: 4,
    maxWidth: '65%',
  },
  hostPillAvatar: { width: 20, height: 20, borderRadius: 10 },
  // Neutral dark circle + white initial — matches the app's existing
  // no-photo avatar convention (e.g. ChatHeader), not an attention-grabbing
  // brand color that would compete with the price badge on the same card.
  hostPillAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  hostPillInitial: { fontFamily: FontFamily.headingBold, fontSize: 11, color: '#fff' },
  hostPillText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: '#fff' },

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
  attendees: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },

  spotsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,107,53,0.2)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  spotsText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.brandOrange },
})
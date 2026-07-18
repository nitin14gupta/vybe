import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import { parseServerDate } from '@/lib/dates'
import type { EventSummary } from '@/api/apiService'

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}

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

  return (
    <Pressable style={[s.card, isPast && s.cardPast]} onPress={onPress}>
      {/* 16:9 cover image */}
      <View style={s.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#1a1a1a', '#0d0d0d']} style={[StyleSheet.absoluteFill, s.placeholder]}>
            <Text style={s.placeholderEmoji}>{EVENT_EMOJIS[event.event_type] ?? '🔥'}</Text>
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
          <Text style={s.eventType}>{EVENT_EMOJIS[event.event_type] ?? '🔥'} {event.event_type.replace('_', ' ')}</Text>
          {event.location_name ? (
            <Text style={s.location} numberOfLines={1}>📍 {event.location_name}</Text>
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
          <Text style={s.spotsText}>🔥 Only {event.spots_left} spots left</Text>
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
  placeholderEmoji: { fontSize: 52, textAlign: 'center' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 130 },

  priceBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.brandOrange,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  priceBadgeFree: { backgroundColor: Colors.accentGreen },
  priceText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#fff' },

  statusBadge: {
    position: 'absolute', top: 12, left: 12,
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
  eventType: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, textTransform: 'capitalize' },
  location: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  dist: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
  attendees: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },

  spotsBar: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,107,53,0.2)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  spotsText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.brandOrange },
})
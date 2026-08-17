import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ChevronRight, PartyPopper, QrCode, ScanLine, Star, Users } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hSuccess, hTap } from '@/lib/haptics'
import { PrimaryButton } from '@/components/ui'
import { fmtCountdown, formatPrice, hoursUntil, type RsvpStatus } from './eventDetailUtils'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  eventId: string
  isHost: boolean
  rsvpStatus: RsvpStatus
  attendeesCount: number
  attendeesLoading: boolean
  isPast: boolean
  isInProgress: boolean
  isGoing: boolean
  isWaitlist: boolean
  hasTicket: boolean
  shouldWaitlist: boolean
  spotsLow: boolean
  offerSecondsLeft: number | null
  bottomInset: number
  onScanner: () => void
  onRsvp: () => void
  onJoinWaitlist: () => void
}

export function EventRsvpBar({
  event,
  eventId,
  isHost,
  rsvpStatus,
  attendeesCount,
  attendeesLoading,
  isPast,
  isInProgress,
  isGoing,
  isWaitlist,
  hasTicket,
  shouldWaitlist,
  spotsLow,
  offerSecondsLeft,
  bottomInset,
  onScanner,
  onRsvp,
  onJoinWaitlist,
}: Props) {
  const router = useRouter()

  return (
    <View style={[styles.stickyBar, { paddingBottom: bottomInset + 12 }]}>
      {isHost ? (
        <View style={styles.hostBar}>
          <View style={styles.hostMeta}>
            <Text style={styles.stickyPrice}>{formatPrice(event.price_inr, event.is_free)}</Text>
            {attendeesLoading ? (
              <ActivityIndicator size="small" color={Colors.inkSecondary} />
            ) : (
              <Text style={styles.hostAttendeeCount}>
                {attendeesCount} / {event.capacity} going
              </Text>
            )}
          </View>
          <View style={styles.hostActions}>
            <Pressable
              style={styles.hostBtn}
              onPress={() => router.push(`/(events)/${eventId}/attendees` as any)}
            >
              <Users size={16} color={Colors.inkPrimary} strokeWidth={1.8} />
              <Text style={styles.hostBtnText}>Attendees</Text>
            </Pressable>
            <Pressable
              style={[styles.hostBtn, styles.hostBtnPrimary]}
              onPress={isPast
                ? () => router.push(`/(events)/${eventId}/reviews` as any)
                : onScanner}
            >
              <LinearGradient
                colors={[Colors.brandOrange, Colors.brandCoral]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.hostBtnGradient}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {isPast
                    ? <Star size={16} color={Colors.background} strokeWidth={2} />
                    : <ScanLine size={16} color={Colors.background} strokeWidth={2} />}
                  <Text style={styles.hostBtnPrimaryText}>
                    {isPast ? 'Review' : 'Scanner'}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.stickyLeft}>
            {spotsLow && !isGoing && !isWaitlist && (
              <View style={styles.spotsAlert}>
                <View style={styles.spotsDot} />
                <Text style={styles.spotsText}>Only {event.spots_left} left</Text>
              </View>
            )}
            <Text style={styles.stickyPrice}>{formatPrice(event.price_inr, event.is_free)}</Text>
          </View>

          {event.is_cancelled ? (
            <View style={styles.cancelledBadge}>
              <Text style={styles.cancelledText}>Cancelled</Text>
            </View>
          ) : isPast && (isGoing || hasTicket) ? (
            event?.my_review_rating ? (
              <View style={styles.reviewedPill}>
                <Star size={13} color={Colors.brandOrange} fill={Colors.brandOrange} strokeWidth={1.5} />
                <Text style={styles.reviewedPillText}>Reviewed ✓</Text>
              </View>
            ) : (
              <PrimaryButton
                label="Rate Event"
                onPress={() => router.push(`/(events)/${eventId}/review` as any)}
                style={{ minWidth: 140 }}
              />
            )
          ) : isGoing || hasTicket ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={styles.goingBtn}>
                <Text style={styles.goingBtnText}>Going ✓</Text>
              </View>
              <Pressable
                style={styles.ticketBtn}
                onPress={() => router.push(`/(events)/${eventId}/ticket` as any)}
              >
                <QrCode size={16} color={Colors.brandOrange} />
                <Text style={styles.ticketBtnText}>Ticket</Text>
              </Pressable>
            </View>
          ) : isInProgress ? (
            <View style={styles.inProgressBtn}>
              <Text style={styles.inProgressText}>Event in Progress</Text>
            </View>
          ) : rsvpStatus === 'loading' ? (
            <View style={styles.waitlistBtn}>
              <ActivityIndicator color={Colors.brandOrange} />
            </View>
          ) : isWaitlist && event.my_offer_expires_at ? (
            <Pressable style={styles.offerBtn} onPress={() => { hSuccess(); onRsvp() }}>
              <LinearGradient
                colors={[Colors.brandOrange, Colors.brandCoral]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.offerGradient}
              >
                <View style={styles.offerTitleRow}>
                  <Text style={styles.offerTitle}>Spot Reserved!</Text>
                  <PartyPopper size={13} color={Colors.inkPrimary} strokeWidth={2} />
                </View>
                <Text style={styles.offerTimer}>
                  Confirm by {offerSecondsLeft != null ? fmtCountdown(offerSecondsLeft) : '...'}
                </Text>
              </LinearGradient>
            </Pressable>
          ) : isWaitlist ? (
            <Pressable
              style={styles.waitlistActiveBtn}
              onPress={() => {
                hTap()
                router.push({
                  pathname: '/(events)/[id]/waitlist-joined' as any,
                  params: {
                    id: eventId,
                    position: String(event.my_waitlist_position ?? 1),
                    coverUrl: event.cover_photos?.[0]?.url ?? '',
                    title: event.title,
                  },
                })
              }}
            >
              <Text style={styles.waitlistActiveBtnText}>
                On Waitlist{event.my_waitlist_position ? ` · #${event.my_waitlist_position}` : ''}
              </Text>
              <ChevronRight size={14} color={Colors.brandOrange} strokeWidth={2} />
            </Pressable>
          ) : shouldWaitlist && hoursUntil(event.date_time) < 2 ? (
            <View style={styles.eventFullBtn}>
              <Text style={styles.waitlistBtnText}>Event starts soon</Text>
            </View>
          ) : shouldWaitlist && event.is_waitlist_full ? (
            <View style={styles.waitlistFullBtn}>
              <Text style={styles.waitlistBtnText}>Waitlist Full</Text>
            </View>
          ) : shouldWaitlist ? (
            <Pressable style={styles.waitlistJoinBtn} onPress={() => { hSuccess(); onJoinWaitlist() }}>
              <Text style={styles.waitlistJoinText}>Join Waitlist</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.bookBtn} onPress={() => { hSuccess(); onRsvp() }}>
              <LinearGradient
                colors={[Colors.brandOrange, Colors.brandCoral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookGradient}
              >
                <Text style={styles.bookBtnText}>
                  {event.is_free ? 'RSVP Free' : 'Book Now'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: withOpacity(Colors.background, 0.95),
    gap: 16,
  },
  stickyLeft: { flex: 1 },
  spotsAlert: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  spotsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brandCoral },
  spotsText: { color: Colors.brandCoral, fontFamily: FontFamily.bodyMedium, fontSize: 12 },
  stickyPrice: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },

  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookGradient: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: 'center', minWidth: 120 },
  bookBtnText: { color: Colors.inkPrimary, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  reviewedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, height: 48,
    borderRadius: 24, borderWidth: 1,
    borderColor: withOpacity(Colors.brandOrange, 0.3),
    backgroundColor: withOpacity(Colors.brandOrange, 0.08),
  },
  reviewedPillText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },

  goingBtn: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  goingBtnText: { color: Colors.inkPrimary, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  waitlistActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: withOpacity(Colors.brandOrange, 0.1),
    borderWidth: 1.5,
    borderColor: withOpacity(Colors.brandOrange, 0.35),
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 120,
  },
  waitlistActiveBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.brandOrange,
  },
  waitlistBtn: {
    backgroundColor: Colors.elevated,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    minWidth: 120,
  },
  waitlistBtnText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },
  waitlistJoinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brandOrange,
    minWidth: 130,
  },
  waitlistJoinText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  offerBtn: { borderRadius: 16, overflow: 'hidden', minWidth: 150 },
  offerGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  offerTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
  offerTimer: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: Colors.inkPrimary,
    letterSpacing: 0.5,
  },
  eventFullBtn: {
    backgroundColor: Colors.elevated,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    minWidth: 120,
  },
  waitlistFullBtn: {
    backgroundColor: Colors.elevated,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    minWidth: 120,
  },

  inProgressBtn: {
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    minWidth: 140,
  },
  inProgressText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkSecondary,
    letterSpacing: 0.1,
  },

  cancelledBadge: {
    backgroundColor: withOpacity(Colors.brandCoral, 0.15),
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.brandCoral,
  },
  cancelledText: { color: Colors.brandCoral, fontFamily: FontFamily.bodySemiBold, fontSize: 14 },

  ticketBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.brandOrange,
  },
  ticketBtnText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 14 },

  hostBar: { flex: 1, gap: 10 },
  hostMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hostAttendeeCount: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary,
  },
  hostActions: { flexDirection: 'row', gap: 10 },
  hostBtn: {
    flex: 1, height: 48, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: withOpacity(Colors.inkPrimary, 0.18),
  },
  hostBtnPrimary: { borderWidth: 0, overflow: 'hidden' },
  hostBtnGradient: {
    flex: 1, width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 24,
  },
  hostBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  hostBtnPrimaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})

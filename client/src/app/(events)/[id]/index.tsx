import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { ShareEventSheet } from '@/components/ui'
import { StaticEventMap } from '@/components/maps'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { useGoBack } from '@/hooks/useGoBack'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  Pencil,
  QrCode,
  ScanLine,
  Share2,
  Shield,
  Star,
  Users,
  X as XIcon,
} from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type EventDetail, type EventAttendee } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { ConfirmSheet } from '@/components/ui'

// ── Event options bottom sheet ────────────────────────────────────────────────

function renderOptionsBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.5} />
}

function EventOptionsSheetCore({ id, onCancel, onClose }: { id: string; onCancel: () => void; onClose: () => void }) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const router = useRouter()
  useEffect(() => { sheetRef.current?.present() }, [])
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['28%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderOptionsBackdrop}
      backgroundStyle={styles.optionsBg}
      handleIndicatorStyle={styles.optionsHandle}
    >
      <BottomSheetView style={styles.optionsContent}>
        <Pressable style={styles.optionItem} onPress={() => { onClose(); router.push(`/(events)/${id}/edit` as any) }}>
          <Pencil size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
          <Text style={styles.optionText}>Edit Event</Text>
        </Pressable>
        <View style={styles.optionDivider} />
        <Pressable style={styles.optionItem} onPress={() => { onClose(); onCancel() }}>
          <XIcon size={20} color={Colors.brandCoral} strokeWidth={1.8} />
          <Text style={[styles.optionText, { color: Colors.brandCoral }]}>Cancel Event</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

function EventOptionsSheet({ visible, id, onCancel, onClose }: { visible: boolean; id: string; onCancel: () => void; onClose: () => void }) {
  if (!visible) return null
  return <EventOptionsSheetCore id={id} onCancel={onCancel} onClose={onClose} />
}

const { width: W } = Dimensions.get('window')

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}


function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

function formatDateTime(iso: string | null | undefined) {
  const d = parseDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function daysUntil(iso: string) {
  const diff = (parseDate(iso)?.getTime() ?? 0) - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days away`
}

function formatPrice(price: number, isFree: boolean) {
  if (isFree) return 'Free'
  return `₹${price}`
}

type RsvpStatus = 'idle' | 'going' | 'waitlist' | 'loading'

const EVENT_PAST_THRESHOLD_MS = 0 // show rate button as soon as date_time passes

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  useHardwareBack()
  const goBack = useGoBack()
  const myId = useAuthStore(s => s.userId)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('idle')
  const [photoIdx, setPhotoIdx] = useState(0)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const showPill = usePillStore(s => s.show)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        if (ev.host_id === myId) {
          setAttendeesLoading(true)
          ApiService.getEventAttendees(id)
            .then(r => setAttendees(r.attendees))
            .catch(() => {})
            .finally(() => setAttendeesLoading(false))
        }
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id, myId])

  const handleRsvp = () => {
    if (!event) return
    router.push(`/(events)/${id}/book` as any)
  }

  const handleCancelEvent = () => setCancelConfirm(true)

  const doCancelEvent = async () => {
    try {
      await ApiService.cancelEvent(id!)
      setEvent(prev => prev ? { ...prev, is_cancelled: true } : prev)
    } catch (e: any) {
      showPill("Couldn't cancel this event, try again", 'error')
    }
  }

  const handleShare = () => {
    if (!event) return
    setShareOpen(true)
  }

  const isPast = event ? new Date(event.date_time.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')) < new Date() : false
  const hasTicket = !!(event?.my_ticket_token)

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  if (!event) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Event not found</Text>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  const spotsLow = event.spots_left <= 10 && !event.is_free
  const isGoing = rsvpStatus === 'going'
  const isWaitlist = rsvpStatus === 'waitlist'
  const coverPhotos = event.cover_photos ?? []

  return (
    <View style={styles.root}>
      {/* Hero photo carousel */}
      <View style={styles.hero}>
        {coverPhotos.length > 0 ? (
          <>
            <FlatList
              data={coverPhotos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={e => {
                setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))
              }}
              renderItem={({ item }) => (
                <Image source={{ uri: item.url }} style={{ width: W, height: 340 }} contentFit="cover" />
              )}
            />
            {coverPhotos.length > 1 && (
              <View style={styles.photoDots}>
                {coverPhotos.map((_, i) => (
                  <View key={i} style={[styles.photoDot, i === photoIdx && styles.photoDotActive]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <LinearGradient
            colors={['#1A1A1A', '#111111']}
            style={[{ width: W, height: 340 }, styles.heroPlaceholder]}
          >
            <Text style={styles.heroEmoji}>{EVENT_EMOJIS[event.event_type] ?? '🔥'}</Text>
          </LinearGradient>
        )}

        {/* Overlay buttons */}
        <View style={[styles.heroOverlay, { top: insets.top + 8 }]}>
          <Pressable style={styles.heroCircleBtn} onPress={goBack}>
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.heroCircleBtn} onPress={handleShare}>
              <Share2 size={20} color="#fff" />
            </Pressable>
            {event?.host_id === myId && (
              <Pressable style={styles.heroCircleBtn} onPress={() => setOptionsOpen(true)}>
                <MoreVertical size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>

      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category + title */}
        <View style={styles.categoryRow}>
          <Text style={styles.categoryChip}>{EVENT_EMOJIS[event.event_type]} {event.event_type.replace('_', ' ')}</Text>
          {event.age_restriction && (
            <View style={styles.ageBadge}>
              <Shield size={12} color={Colors.inkSecondary} />
              <Text style={styles.ageBadgeText}>{event.age_restriction}+</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.daysAway}>{daysUntil(event.date_time)}</Text>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={Colors.brandOrange} />
            <Text style={styles.infoText}>{formatDateTime(event.date_time)}</Text>
          </View>
          {event.end_time && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Clock size={16} color={Colors.inkSecondary} />
                <Text style={styles.infoText}>Ends {formatDateTime(event.end_time)}</Text>
              </View>
            </>
          )}
          {event.location_name && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <MapPin size={16} color={Colors.brandOrange} />
                <Text style={styles.infoText}>{event.location_name}</Text>
              </View>
            </>
          )}
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Users size={16} color={Colors.inkSecondary} />
            <Text style={styles.infoText}>
              {event.attendee_count} going · {event.spots_left} spots left
            </Text>
          </View>
        </View>

        {/* Host card */}
        {event.host_name && (
          <View style={styles.hostCard}>
            <View style={styles.hostAvatar}>
              {event.host_avatar ? (
                <Image source={{ uri: event.host_avatar }} style={styles.hostAvatarImg} contentFit="cover" />
              ) : (
                <Text style={styles.hostAvatarFallback}>{event.host_name[0]}</Text>
              )}
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{event.host_name}</Text>
            </View>
          </View>
        )}

        {/* About */}
        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text
              style={styles.sectionBody}
              numberOfLines={showFullDesc ? undefined : 3}
            >
              {event.description}
            </Text>
            {event.description.length > 140 && (
              <Pressable onPress={() => setShowFullDesc(p => !p)}>
                <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* Rules */}
        {event.rules ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House Rules</Text>
            <Text style={styles.sectionBody}>{event.rules}</Text>
          </View>
        ) : null}

        {/* Mini map */}
        {event.location_lat != null && event.location_lng != null && (
          <View style={styles.miniMapWrap}>
            <StaticEventMap
              lat={event.location_lat}
              lng={event.location_lng}
              eventType={event.event_type}
            />
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
        {event.host_id === myId ? (
          /* ── Host view ── */
          <View style={styles.hostBar}>
            <View style={styles.hostMeta}>
              <Text style={styles.stickyPrice}>{formatPrice(event.price_inr, event.is_free)}</Text>
              {attendeesLoading ? (
                <ActivityIndicator size="small" color={Colors.inkSecondary} />
              ) : (
                <Text style={styles.hostAttendeeCount}>
                  {attendees.length} / {event.capacity} going
                </Text>
              )}
            </View>
            <View style={styles.hostActions}>
              <Pressable
                style={styles.hostBtn}
                onPress={() => router.push(`/(events)/${id}/attendees` as any)}
              >
                <Users size={16} color={Colors.inkPrimary} strokeWidth={1.8} />
                <Text style={styles.hostBtnText}>Attendees</Text>
              </Pressable>
              <Pressable
                style={[styles.hostBtn, styles.hostBtnPrimary]}
                onPress={() => router.push(`/(events)/${id}/scanner` as any)}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF3864']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.hostBtnGradient}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ScanLine size={16} color="#111" strokeWidth={2} />
                    <Text style={styles.hostBtnPrimaryText}>Scanner</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ── Attendee view ── */
          <>
            <View style={styles.stickyLeft}>
              {spotsLow && !isGoing && (
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
              <Pressable
                style={styles.bookBtn}
                onPress={() => router.push(`/(events)/${id}/review` as any)}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF3864']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.bookGradient}
                >
                  <Star size={15} color="#fff" fill="#fff" />
                  <Text style={[styles.bookBtnText, { marginLeft: 6 }]}>Rate Event</Text>
                </LinearGradient>
              </Pressable>
            ) : isGoing || hasTicket ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={styles.goingBtn}>
                  <Text style={styles.goingBtnText}>Going ✓</Text>
                </View>
                <Pressable
                  style={styles.ticketBtn}
                  onPress={() => router.push(`/(events)/${id}/ticket` as any)}
                >
                  <QrCode size={16} color={Colors.brandOrange} />
                  <Text style={styles.ticketBtnText}>Ticket</Text>
                </Pressable>
              </View>
            ) : isWaitlist ? (
              <View style={styles.waitlistBtn}>
                <Text style={styles.waitlistBtnText}>On Waitlist</Text>
              </View>
            ) : (
              <Pressable style={styles.bookBtn} onPress={handleRsvp}>
                <LinearGradient
                  colors={['#FF6B35', '#FF3864']}
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

      <ShareEventSheet
        visible={shareOpen}
        event={event}
        onClose={() => setShareOpen(false)}
      />
      <EventOptionsSheet
        visible={optionsOpen}
        id={id ?? ''}
        onCancel={handleCancelEvent}
        onClose={() => setOptionsOpen(false)}
      />
      <ConfirmSheet
        visible={cancelConfirm}
        title="Cancel Event"
        body="Are you sure? Attendees will be notified. This cannot be undone."
        confirmLabel="Cancel Event"
        destructive
        onConfirm={doCancelEvent}
        onClose={() => setCancelConfirm(false)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },

  hero: { height: 340, backgroundColor: Colors.surface },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 72 },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  heroCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { backgroundColor: '#fff', width: 18 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryChip: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  ageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ageBadgeText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyMedium, fontSize: 12 },

  title: { fontFamily: FontFamily.headingBold, fontSize: 28, color: Colors.inkPrimary, lineHeight: 34, marginBottom: 4 },
  daysAway: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandOrange, marginBottom: 20 },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkPrimary, lineHeight: 20 },
  infoDivider: { height: 1, backgroundColor: Colors.divider },

  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    marginBottom: 16,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarImg: { width: '100%', height: '100%' },
  hostAvatarFallback: { color: Colors.inkPrimary, fontFamily: FontFamily.headingBold, fontSize: 18 },
  hostInfo: { flex: 1 },
  hostLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginBottom: 2 },
  hostName: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },

  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginBottom: 8 },
  sectionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 22 },
  readMore: { color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium, fontSize: 13, marginTop: 6 },

  miniMapWrap: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  miniMapPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(17,17,17,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 16,
  },
  stickyLeft: { flex: 1 },
  spotsAlert: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  spotsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brandCoral },
  spotsText: { color: Colors.brandCoral, fontFamily: FontFamily.bodyMedium, fontSize: 12 },
  stickyPrice: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },

  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookGradient: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: 'center', minWidth: 120 },
  bookBtnText: { color: '#fff', fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  goingBtn: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  goingBtnText: { color: '#fff', fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

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

  cancelledBadge: {
    backgroundColor: 'rgba(255,56,100,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.brandCoral,
  },
  cancelledText: { color: Colors.brandCoral, fontFamily: FontFamily.bodySemiBold, fontSize: 14 },

  errorText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyRegular, fontSize: 16, marginBottom: 16 },
  backBtn: { marginTop: 8 },
  backBtnText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  ticketBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.brandOrange,
  },
  ticketBtnText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 14 },

  optionsBg: { backgroundColor: Colors.surface },
  optionsHandle: { backgroundColor: 'rgba(255,255,255,0.2)' },
  optionsContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  optionText: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
  optionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },

  // Host bar
  hostBar: { flex: 1, gap: 10 },
  hostMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hostAttendeeCount: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary,
  },
  hostActions: { flexDirection: 'row', gap: 10 },
  hostBtn: {
    flex: 1, height: 48, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  hostBtnPrimary: { borderWidth: 0, overflow: 'hidden' },
  hostBtnGradient: {
    flex: 1, width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 24,
  },
  hostBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  hostBtnPrimaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: '#fff' },
})

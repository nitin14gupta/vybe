import { useEffect, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, Clock, MapPin, Shield, Users } from 'lucide-react-native'
import { Colors, FontFamily, PLATFORM_FEE_RATE, PLATFORM_FEE_PERCENT_LABEL } from '@/constants'
import { hTap, hSelection } from '@/lib/haptics'
import { EventCard } from '@/components/EventCard'
import { StaticEventMap } from '@/components/maps'
import ApiService, { type EventSummary } from '@/api/apiService'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { EVENT_TYPES } from './styles'

const { width: W } = Dimensions.get('window')

const EVENT_EMOJIS: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map(t => [t.key, t.emoji]),
)

interface Props {
  visible: boolean
  form: CreateEventForm
  onClose: () => void
}

type Tab = 'card' | 'page'

function formatFullDateTime(d: Date | null) {
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatPrice(price: number, isFree: boolean) {
  return isFree ? 'Free' : `₹${price}`
}

export function EventPreviewOverlay({ visible, form, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('card')
  const [hostName, setHostName] = useState('You')
  const [hostAvatar, setHostAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    ApiService.getMe()
      .then(me => {
        setHostName(me.name ?? 'You')
        setHostAvatar(me.photos?.[0]?.url ?? null)
      })
      .catch(() => {})
  }, [visible])

  if (!visible) return null

  const coverPhotos = form.coverPhotos.filter(Boolean).map((url, position) => ({ url, position }))

  const previewSummary: EventSummary = {
    id: 'preview',
    title: form.title || 'Untitled Event',
    event_type: form.eventType || 'other',
    date_time: form.dateTime ? form.dateTime.toISOString() : '',
    end_time: form.endTime ? form.endTime.toISOString() : null,
    location_name: form.locationName || null,
    location_lat: form.locationLat,
    location_lng: form.locationLng,
    price_inr: form.priceInr,
    is_free: form.isFree,
    spots_left: form.capacity,
    capacity: form.capacity,
    distance_km: null,
    cover_photos: coverPhotos,
    host_name: hostName,
    host_avatar: hostAvatar,
    age_restriction: form.ageRestriction,
    attendee_count: 0,
    waitlist_count: 0,
    is_waitlist_full: false,
  }

  const heroPhoto = coverPhotos[0]?.url
  const heroHeight = W * (9 / 16)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => { hTap(); onClose() }} hitSlop={10}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
          <Text style={s.backText}>Back to Edit</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <Pressable
          style={[s.tab, tab === 'card' && s.tabActive]}
          onPress={() => { hSelection(); setTab('card') }}
        >
          <Text style={[s.tabText, tab === 'card' && s.tabTextActive]}>As a Card</Text>
        </Pressable>
        <Pressable
          style={[s.tab, tab === 'page' && s.tabActive]}
          onPress={() => { hSelection(); setTab('page') }}
        >
          <Text style={[s.tabText, tab === 'page' && s.tabTextActive]}>Full Event Page</Text>
        </Pressable>
      </View>

      {tab === 'card' ? (
        <ScrollView contentContainerStyle={s.cardTabContent} showsVerticalScrollIndicator={false}>
          <Text style={s.cardTabHint}>This is how your event looks in Discover and lists</Text>
          <EventCard event={previewSummary} onPress={() => {}} showHost />
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Hero — true 16:9, matches EventCard */}
          <View style={[s.hero, { height: heroHeight }]}>
            {heroPhoto ? (
              <Image source={{ uri: heroPhoto }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <LinearGradient colors={['#1A1A1A', '#111111']} style={[StyleSheet.absoluteFill, s.heroPlaceholder]}>
                <Text style={s.heroEmoji}>{EVENT_EMOJIS[form.eventType] ?? '🔥'}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={s.pageContent}>
            <View style={s.categoryRow}>
              <Text style={s.categoryChip}>
                {EVENT_EMOJIS[form.eventType] ?? '🔥'} {(form.eventType || 'other').replace('_', ' ')}
              </Text>
              {form.ageRestriction && (
                <View style={s.ageBadge}>
                  <Shield size={12} color={Colors.inkSecondary} />
                  <Text style={s.ageBadgeText}>{form.ageRestriction}+</Text>
                </View>
              )}
            </View>

            <Text style={s.title}>{form.title || 'Untitled Event'}</Text>

            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <Calendar size={16} color={Colors.brandOrange} />
                <Text style={s.infoText}>{formatFullDateTime(form.dateTime)}</Text>
              </View>
              {form.endTime && (
                <>
                  <View style={s.infoDivider} />
                  <View style={s.infoRow}>
                    <Clock size={16} color={Colors.inkSecondary} />
                    <Text style={s.infoText}>Ends {formatFullDateTime(form.endTime)}</Text>
                  </View>
                </>
              )}
              {form.locationName ? (
                <>
                  <View style={s.infoDivider} />
                  <View style={s.infoRow}>
                    <MapPin size={16} color={Colors.brandOrange} />
                    <Text style={s.infoText}>{form.locationName}</Text>
                  </View>
                </>
              ) : null}
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <Users size={16} color={Colors.inkSecondary} />
                <Text style={s.infoText}>0 going · {form.capacity} spots left</Text>
              </View>
            </View>

            <View style={s.hostCard}>
              <View style={s.hostAvatar}>
                {hostAvatar ? (
                  <Image source={{ uri: hostAvatar }} style={s.hostAvatarImg} contentFit="cover" />
                ) : (
                  <Text style={s.hostAvatarFallback}>{hostName[0]}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.hostLabel}>Hosted by</Text>
                <Text style={s.hostName}>{hostName}</Text>
              </View>
            </View>

            {form.description ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>About</Text>
                <Text style={s.sectionBody}>{form.description}</Text>
              </View>
            ) : null}

            {form.rules ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>House Rules</Text>
                <Text style={s.sectionBody}>{form.rules}</Text>
              </View>
            ) : null}

            {form.locationLat != null && form.locationLng != null && (
              <View style={s.miniMapWrap}>
                <StaticEventMap lat={form.locationLat} lng={form.locationLng} eventType={form.eventType} />
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Static, disabled RSVP preview — actions don't fire in preview mode */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={s.previewNote}>Preview only — actions are disabled</Text>
        <View style={s.stickyRow}>
          <View>
            <Text style={s.stickyPrice}>
              {formatPrice(
                form.isFree ? 0 : form.priceInr + Math.round(form.priceInr * PLATFORM_FEE_RATE),
                form.isFree,
              )}
            </Text>
            {!form.isFree && form.priceInr > 0 ? (
              <Text style={s.stickyPriceSub}>
                Attendee pays this total (₹{form.priceInr} + {PLATFORM_FEE_PERCENT_LABEL} fee)
              </Text>
            ) : null}
          </View>
          <View style={s.previewBookBtn}>
            <Text style={s.previewBookBtnText}>{form.isFree ? 'RSVP Free' : 'Book Now'}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.elevated },
  tabText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  tabTextActive: { color: Colors.inkPrimary, fontFamily: FontFamily.bodySemiBold },

  cardTabContent: { padding: 20, paddingBottom: 140 },
  cardTabHint: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginBottom: 16, textAlign: 'center' },

  hero: { width: W, backgroundColor: Colors.surface },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 64 },

  pageContent: { padding: 20, paddingBottom: 140 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryChip: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium, fontSize: 12, textTransform: 'capitalize',
  },
  ageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ageBadgeText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyMedium, fontSize: 12 },

  title: { fontFamily: FontFamily.headingBold, fontSize: 28, color: Colors.inkPrimary, lineHeight: 34, marginBottom: 20 },

  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.divider,
    padding: 16, marginBottom: 16, gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkPrimary, lineHeight: 20 },
  infoDivider: { height: 1, backgroundColor: Colors.divider },

  hostCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.divider,
    padding: 14, marginBottom: 16,
  },
  hostAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.elevated,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarImg: { width: '100%', height: '100%' },
  hostAvatarFallback: { color: Colors.inkPrimary, fontFamily: FontFamily.headingBold, fontSize: 18 },
  hostLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginBottom: 2 },
  hostName: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },

  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginBottom: 8 },
  sectionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 22 },

  miniMapWrap: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },

  stickyBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 10,
    backgroundColor: 'rgba(17,17,17,0.95)',
    gap: 8,
  },
  stickyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stickyPrice: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  stickyPriceSub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary, marginTop: 2 },
  previewBookBtn: {
    borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14,
    backgroundColor: Colors.elevated, minWidth: 120, alignItems: 'center',
    opacity: 0.6,
  },
  previewBookBtnText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },
  previewNote: {
    alignSelf: 'center',
    fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled,
  },
})

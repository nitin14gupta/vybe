import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StaticEventMap } from '@/components/maps'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Shield,
  Users,
} from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type EventDetail } from '@/api/apiService'

const { width: W } = Dimensions.get('window')

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}


function formatDateTime(iso: string) {
  const d = new Date(iso)
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
  const diff = new Date(iso).getTime() - Date.now()
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

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('idle')
  const [photoIdx, setPhotoIdx] = useState(0)
  const [showFullDesc, setShowFullDesc] = useState(false)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(setEvent)
      .catch(() => Alert.alert('Error', 'Could not load event'))
      .finally(() => setLoading(false))
  }, [id])

  const handleRsvp = async () => {
    if (!event || rsvpStatus === 'loading') return
    setRsvpStatus('loading')
    try {
      const res = await ApiService.rsvpEvent(event.id, 'going')
      setRsvpStatus(res.status as RsvpStatus)
      setEvent(prev => prev ? { ...prev, spots_left: Math.max(0, prev.spots_left - 1), attendee_count: prev.attendee_count + 1 } : prev)
    } catch (e: any) {
      Alert.alert('Cannot RSVP', e.message)
      setRsvpStatus('idle')
    }
  }

  const handleShare = () => {
    if (!event) return
    Share.share({ message: `Check out "${event.title}" on VYBE!` })
  }

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
          <Pressable style={styles.heroCircleBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <Pressable style={styles.heroCircleBtn} onPress={handleShare}>
            <Share2 size={20} color="#fff" />
          </Pressable>
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
        ) : isGoing ? (
          <View style={styles.goingBtn}>
            <Text style={styles.goingBtnText}>Going ✓</Text>
          </View>
        ) : isWaitlist ? (
          <View style={styles.waitlistBtn}>
            <Text style={styles.waitlistBtnText}>On Waitlist</Text>
          </View>
        ) : (
          <Pressable
            style={styles.bookBtn}
            onPress={handleRsvp}
            disabled={rsvpStatus === 'loading'}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF3864']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookGradient}
            >
              {rsvpStatus === 'loading' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.bookBtnText}>
                  {event.is_free ? 'RSVP Free' : 'Book Now'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>
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
})

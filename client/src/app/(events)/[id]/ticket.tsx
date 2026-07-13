import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, Download, MapPin, Share2 } from 'lucide-react-native'
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import ViewShot, { type ViewShotRef } from 'react-native-view-shot'
import { Asset as MediaAsset, requestPermissionsAsync as requestMediaPermissionsAsync } from 'expo-media-library'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, Radius, Spacing, ComponentSize } from '@/constants'
import ApiService, { type TicketInfo } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { ConfettiRain, StyledQr } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'
import { EventShareCard } from '@/components/EventShareCard'
import { useImageShare } from '@/hooks/useImageShare'

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}

function parseTs(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtTime(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function orderRef(token: string): string {
  const tail = token.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
  return `TKT-${tail}`
}

// ── Heading block ─────────────────────────────────────────────────────────────

function HeadingBlock() {
  const fadeY = useRef(new Animated.Value(20)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeY, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[s.headingBlock, { opacity, transform: [{ translateY: fadeY }] }]}>
      <Text style={s.headline}>You're going! 🎉</Text>
      <Text style={s.sub}>Your ticket is ready — show it at the door.</Text>
    </Animated.View>
  )
}

// ── Ticket card ───────────────────────────────────────────────────────────────

function TicketCard({ ticket }: { ticket: TicketInfo }) {
  const emoji = EVENT_EMOJIS[ticket.event_type] ?? '🔥'

  return (
    <View style={s.card}>
      {/* Info */}
      <View style={s.cardTop}>
        <Text style={s.cardTitle}>{ticket.event_title}</Text>
        <View style={s.cardMeta}>
          <View style={s.metaRow}>
            <Calendar size={15} color={Colors.inkSecondary} strokeWidth={1.5} />
            <View style={s.metaTexts}>
              <Text style={s.metaMain}>{fmtDate(ticket.date_time)}</Text>
              {ticket.date_time && (
                <Text style={s.metaSub}>Doors open · {fmtTime(ticket.date_time)}</Text>
              )}
            </View>
          </View>
          {ticket.location_name && (
            <View style={s.metaRow}>
              <MapPin size={15} color={Colors.inkSecondary} strokeWidth={1.5} />
              <Text style={s.metaMain} numberOfLines={1}>{ticket.location_name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Perforated tear line */}
      <View style={s.tearRow}>
        <View style={s.tearHole} />
        <View style={s.tearDash} />
        <View style={s.tearHole} />
      </View>

      {/* QR */}
      <View style={s.qrSection}>
        <View style={s.qrPaper}>
          <StyledQr data={ticket.ticket_token} size={176} />
        </View>
        <Text style={s.scanHint}>Scan at the door</Text>
        <Text style={s.orderRef}>{orderRef(ticket.ticket_token)}</Text>
      </View>
    </View>
  )
}

// ── Animated save button ──────────────────────────────────────────────────────

function SaveButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPressIn={() => {
        hTap()
        scale.value = withSpring(0.94, { damping: 18, stiffness: 380 })
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 180 })
      }}
      onPress={onPress}
    >
        <LinearGradient
          colors={[Colors.brandOrange, Colors.brandCoral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.saveGradient}
        >
          <Download size={18} color={Colors.background} strokeWidth={2.2} />
          <Text style={s.saveBtnText}>Save to Photos</Text>
        </LinearGradient>
    </Pressable>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const goBack = useGoBack()
  const showPill = usePillStore(s => s.show)

  const [ticket, setTicket] = useState<TicketInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [coverUrl, setCoverUrl] = useState('')
  const cardRef = useRef<ViewShotRef>(null)
  const shareCardRef = useRef<View>(null)
  const { shareImage } = useImageShare()

  useEffect(() => {
    if (!id) return
    ApiService.getMyTicket(id)
      .then(setTicket)
      .catch(() => showPill("Couldn't load your ticket", 'error'))
      .finally(() => setLoading(false))
    ApiService.getEvent(id)
      .then(ev => setCoverUrl(ev.cover_photos?.[0]?.url ?? ''))
      .catch(() => {})
  }, [id])

  const handleShare = async () => {
    if (!ticket) return
    const message = `I'm going to "${ticket.event_title}"! 🎉\n${fmtDate(ticket.date_time)}${ticket.location_name ? `\n📍 ${ticket.location_name}` : ''}`
    if (coverUrl) {
      const result = await shareImage(shareCardRef, { message, title: ticket.event_title })
      if (result.shared || result.error === 'cancelled') return
    }
    await Share.share({ message, title: ticket.event_title })
  }

  const handleSave = async () => {
    if (!cardRef.current) return
    try {
      const { status } = await requestMediaPermissionsAsync()
      if (status !== 'granted') {
        showPill('Allow photo access to save your ticket', 'error')
        return
      }
      const uri = await (cardRef.current as any).capture()
      await MediaAsset.create(uri)
      hSuccess()
      showPill('Ticket saved to Photos!', 'default')
    } catch {
      showPill("Couldn't save ticket, try again", 'error')
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  if (!ticket) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <Text style={s.errorText}>Ticket not found</Text>
        <Pressable onPress={goBack}>
          <Text style={s.backLinkText}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ConfettiRain />

      {/* Content — starts behind status bar, paddingTop makes room for float bar */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Orange glow bleeds into status bar area */}
        <LinearGradient
          colors={['rgba(255,107,53,0.22)', 'transparent']}
          style={s.ambientGlow}
          pointerEvents="none"
        />

        <HeadingBlock />

        <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }} style={s.viewShot}>
          <TicketCard ticket={ticket} />
        </ViewShot>

        {/* Actions */}
        <View style={s.actions}>
          <SaveButton onPress={handleSave} />

          <Pressable
            style={s.shareBtn}
            onPress={() => { hTap(); handleShare() }}
          >
            <Share2 size={18} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.shareBtnText}>Share Event</Text>
          </Pressable>
        </View>

        <Pressable
          style={s.allTicketsLink}
          onPress={() => router.replace('/(settings)/joined-events' as any)}
        >
          <Text style={s.allTicketsText}>View all tickets →</Text>
        </Pressable>
      </ScrollView>

      {/* Floating back + share — rendered after scroll so they sit on top */}
      <View
        style={[s.floatingBar, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable style={s.circleBtn} onPress={goBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Pressable style={s.circleBtn} onPress={() => { hTap(); handleShare() }} hitSlop={8}>
          <Share2 size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* Off-screen — captured and shared as an image, never shown to the user */}
      {coverUrl && (
        <View style={s.shareCardHost} pointerEvents="none">
          <EventShareCard
            ref={shareCardRef}
            imageUrl={coverUrl}
            title={ticket.event_title}
            dateTimeLabel={`${fmtDate(ticket.date_time)}${ticket.date_time ? ` · ${fmtTime(ticket.date_time)}` : ''}`}
          />
        </View>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_BG = '#1A1A1A'
const CARD_BORDER = '#2A2A2A'
const QR_BG = '#ECECEC'

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    gap: 24,
  },

  // Ambient glow — absolute inside scroll, bleeds into status bar
  ambientGlow: {
    position: 'absolute',
    top: -80,
    left: -60,
    right: -60,
    height: 320,
  },

  // Floating top bar
  floatingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Heading
  headingBlock: { alignItems: 'center', gap: 6, width: '100%' },
  headline: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 32,
    color: Colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
  },

  // Ticket card
  viewShot: { width: '100%', maxWidth: 400 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: CARD_BG,
    borderRadius: Radius.card + 8,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    shadowColor: Colors.brandOrange,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },

  cardTop: { padding: 20, gap: 14 },
  cardTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  cardMeta: { gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaTexts: { flex: 1, gap: 2 },
  metaMain: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkPrimary,
    flex: 1,
  },
  metaSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },

  // Tear line
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
  },
  tearHole: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.background,
    marginHorizontal: -11,
    zIndex: 1,
  },
  tearDash: {
    flex: 1,
    borderTopWidth: 1.5,
    borderTopColor: CARD_BORDER,
    borderStyle: 'dashed',
  },

  // QR
  qrSection: {
    backgroundColor: QR_BG,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 12,
  },
  qrPaper: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  scanHint: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: '#222',
    textAlign: 'center',
  },
  orderRef: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: '#777',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },

  // Buttons
  actions: { width: '100%', gap: 10 },

  saveGradient: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.background,
    letterSpacing: 0.1,
  },

  shareBtn: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkPrimary,
  },

  // Footer
  allTicketsLink: { paddingVertical: 4 },
  allTicketsText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
    letterSpacing: 0.1,
  },

  // Error
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkSecondary,
    marginBottom: 16,
  },
  backLinkText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandOrange,
  },
})

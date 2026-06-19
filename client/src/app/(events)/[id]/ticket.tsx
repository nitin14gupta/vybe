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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, Download, MapPin, Share2 } from 'lucide-react-native'
import QRCode from 'react-native-qrcode-svg'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type TicketInfo } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { ConfettiRain } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'

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
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/** Derive a short display reference from the ticket token — NOT the secret JWT itself */
function orderRef(token: string): string {
  const tail = token.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
  return `TKT-${tail}`
}

// ── Confetti + header ────────────────────────────────────────────────────────

function HeadingBlock() {
  const fadeY = useRef(new Animated.Value(20)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeY, { toValue: 0, duration: 550, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[s.headingBlock, { opacity, transform: [{ translateY: fadeY }] }]}>
      <Text style={s.headline}>You're going! 🎉</Text>
      <Text style={s.sub}>Your ticket is ready for scanning.</Text>
    </Animated.View>
  )
}

// ── Ticket card ───────────────────────────────────────────────────────────────

function TicketCard({ ticket }: { ticket: TicketInfo }) {
  const emoji = EVENT_EMOJIS[ticket.event_type] ?? '🔥'

  return (
    <View style={s.card}>
      {/* Info section */}
      <View style={s.cardTop}>
        <Text style={s.cardTitle}>{ticket.event_title}</Text>

        <View style={s.cardMeta}>
          <View style={s.metaRow}>
            <Calendar size={16} color={Colors.inkSecondary} strokeWidth={1.5} />
            <View style={s.metaTexts}>
              <Text style={s.metaMain}>{fmtDate(ticket.date_time)}</Text>
              {ticket.date_time && (
                <Text style={s.metaSub}>Doors open at {fmtTime(ticket.date_time)}</Text>
              )}
            </View>
          </View>

          {ticket.location_name && (
            <View style={s.metaRow}>
              <MapPin size={16} color={Colors.inkSecondary} strokeWidth={1.5} />
              <View style={s.metaTexts}>
                <Text style={s.metaMain}>{ticket.location_name}</Text>
              </View>
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

      {/* QR section */}
      <View style={s.qrSection}>
        <View style={s.qrPaper}>
          <QRCode
            value={ticket.ticket_token}
            size={180}
            color="#111111"
            backgroundColor="#ffffff"
          />
        </View>

        <Text style={s.scanHint}>Show this at the door</Text>
        <Text style={s.orderRef}>{orderRef(ticket.ticket_token)}</Text>
      </View>
    </View>
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

  useEffect(() => {
    if (!id) return
    ApiService.getMyTicket(id)
      .then(setTicket)
      .catch(() => showPill('Could not load ticket', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
    if (!ticket) return
    await Share.share({
      message: `I'm going to "${ticket.event_title}"! 🎉\n${fmtDate(ticket.date_time)}${ticket.location_name ? `\n📍 ${ticket.location_name}` : ''}`,
      title: ticket.event_title,
    })
  }

  const handleSave = async () => {
    showPill('Save to Photos coming soon', 'default')
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  if (!ticket) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.errorText}>Ticket not found</Text>
        <Pressable onPress={goBack} style={s.backLink}>
          <Text style={s.backLinkText}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Confetti — behind everything */}
      <ConfettiRain />

      {/* Top nav bar */}
      <View style={s.nav}>
        <Pressable style={s.navBtn} onPress={goBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.navTitle}>Your Ticket</Text>
        <Pressable style={s.navBtn} onPress={handleShare} hitSlop={8}>
          <Share2 size={20} color={Colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient glow */}
        <LinearGradient
          colors={['rgba(255,107,53,0.12)', 'transparent']}
          style={s.ambientGlow}
          pointerEvents="none"
        />

        <HeadingBlock />

        <TicketCard ticket={ticket} />

        {/* Action buttons */}
        <View style={s.actions}>
          <Pressable style={s.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={['#FF6B35', '#FF8C5A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.saveBtnGradient}
            >
              <Download size={18} color="#111" strokeWidth={2} />
              <Text style={s.saveBtnText}>Save to Photos</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={s.shareBtn} onPress={handleShare}>
            <Share2 size={18} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.shareBtnText}>Share Event</Text>
          </Pressable>
        </View>

        {/* Footer link */}
        <Pressable
          style={s.allTicketsLink}
          onPress={() => router.replace('/(settings)/joined-events' as any)}
        >
          <Text style={s.allTicketsText}>View all tickets</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const CARD_BG = '#1A1A1A'
const CARD_BORDER = '#2A2A2A'
const QR_BG = '#ECECEC'

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },

  // Nav
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  scroll: { flex: 1 },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 24 },

  // Glow
  ambientGlow: {
    position: 'absolute',
    top: 0, left: -40, right: -40,
    height: 200,
  },

  // Heading
  headingBlock: { alignItems: 'center', gap: 6, width: '100%' },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.brandOrange,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  // Card top (info)
  cardTop: { padding: 24, gap: 16 },
  admissionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.brandOrange,
    letterSpacing: 2,
  },
  cardTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    lineHeight: 28,
  },
  cardMeta: { gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  metaTexts: { gap: 2, flex: 1 },
  metaMain: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  metaSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },

  // Tear line
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
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

  // QR section
  qrSection: {
    backgroundColor: QR_BG,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 12,
  },
  qrPaper: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  scanHint: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  orderRef: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: '#555',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Action buttons
  actions: { width: '100%', maxWidth: 380, gap: 10 },
  saveBtn: { borderRadius: 32, overflow: 'hidden' },
  saveBtnGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: { fontFamily: FontFamily.headingBold, fontSize: 15, color: '#111' },

  shareBtn: {
    height: 56,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },

  // Footer
  allTicketsLink: { paddingBottom: 8 },
  allTicketsText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.brandOrange,
    textDecorationLine: 'underline',
    textDecorationColor: `${Colors.brandOrange}55`,
  },

  // Error
  errorText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyRegular, fontSize: 16, marginBottom: 16 },
  backLink: {},
  backLinkText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },
})

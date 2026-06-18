import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Share2 } from 'lucide-react-native'
import QRCode from 'react-native-qrcode-svg'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type TicketInfo } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return 'Date TBC'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [ticket, setTicket] = useState<TicketInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const showPill = usePillStore(s => s.show)

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
      message: `My ticket for ${ticket.event_title}: ${ticket.ticket_token}`,
      title: ticket.event_title,
    })
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
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  const emoji = EVENT_EMOJIS[ticket.event_type] ?? '🔥'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Your Ticket</Text>
        <Pressable style={s.headerBtn} onPress={handleShare}>
          <Share2 size={20} color={Colors.inkPrimary} />
        </Pressable>
      </View>

      {/* Ticket card */}
      <View style={s.ticketWrap}>
        <View style={s.ticketCard}>
          {/* Ticket top — gradient header */}
          <LinearGradient
            colors={['#FF6B35', '#FF3864']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.ticketHeader}
          >
            <Text style={s.ticketEmoji}>{emoji}</Text>
            <Text style={s.ticketTitle}>{ticket.event_title}</Text>
            {ticket.host_name && (
              <Text style={s.ticketHost}>Hosted by {ticket.host_name}</Text>
            )}
          </LinearGradient>

          {/* Tear line */}
          <View style={s.tearRow}>
            <View style={s.tearCircle} />
            <View style={s.tearLine} />
            <View style={s.tearCircle} />
          </View>

          {/* QR section */}
          <View style={s.qrSection}>
            <View style={s.qrWrap}>
              <QRCode
                value={ticket.ticket_token}
                size={200}
                color="#111111"
                backgroundColor="#ffffff"
              />
            </View>

            <View style={s.ticketInfo}>
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>DATE & TIME</Text>
                <Text style={s.infoValue}>{formatDateTime(ticket.date_time)}</Text>
              </View>
              {ticket.location_name && (
                <View style={s.infoBlock}>
                  <Text style={s.infoLabel}>LOCATION</Text>
                  <Text style={s.infoValue}>{ticket.location_name}</Text>
                </View>
              )}
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>TICKET ID</Text>
                <Text style={[s.infoValue, { fontFamily: FontFamily.bodyRegular, fontSize: 11 }]} numberOfLines={1}>
                  {ticket.ticket_token ? ticket.ticket_token.slice(0, 16) + '…' : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={s.hint}>Show this QR code at the entrance</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  ticketWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  ticketCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  ticketHeader: {
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  ticketEmoji: { fontSize: 40, marginBottom: 4 },
  ticketTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: '#fff', textAlign: 'center' },
  ticketHost: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: -12,
    backgroundColor: Colors.background,
  },
  tearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    marginHorizontal: -10,
  },
  tearLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    borderStyle: 'dashed',
  },
  qrSection: { padding: 20, alignItems: 'center', gap: 20 },
  qrWrap: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  ticketInfo: { width: '100%', gap: 12 },
  infoBlock: { gap: 2 },
  infoLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: Colors.inkDisabled, letterSpacing: 0.8 },
  infoValue: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  hint: { textAlign: 'center', fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled, paddingBottom: 20 },
  errorText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyRegular, fontSize: 16, marginBottom: 16 },
  backLink: {},
  backLinkText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },
})

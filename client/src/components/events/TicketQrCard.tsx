import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Calendar, MapPin } from 'lucide-react-native'
import { Colors, FontFamily, Radius, LogoBlack } from '@/constants'
import type { TicketInfo } from '@/api/apiService'
import { StyledQr, LogoMark } from '@/components/ui'

export function parseTs(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

export function fmtDate(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtTime(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function orderRef(token: string): string {
  const tail = token.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
  return `TKT-${tail}`
}

export function TicketQrCard({ ticket }: { ticket: TicketInfo }) {
  return (
    <View style={s.card}>
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

             {(ticket.host_name || ticket.attendee_count > 0) && (
          <View style={s.hostRow}>
            {ticket.host_avatar ? (
              <Image source={{ uri: ticket.host_avatar }} style={s.hostAvatar} cachePolicy="memory-disk" priority="low" transition={150} />
            ) : ticket.host_name ? (
              <View style={[s.hostAvatar, s.hostAvatarFallback]}>
                <Text style={s.hostAvatarInitial}>{ticket.host_name[0]}</Text>
              </View>
            ) : null}
            <Text style={s.hostRowText} numberOfLines={1}>
              {ticket.host_name ? `Hosted by ${ticket.host_name}` : ''}
              {ticket.host_name && ticket.attendee_count > 0 ? '  ·  ' : ''}
              {ticket.attendee_count > 0 ? `${ticket.attendee_count} going` : ''}
            </Text>
          </View>
        )}
        </View>
      </View>

      <View style={s.tearRow}>
        <View style={s.tearHole} />
        <View style={s.tearDash} />
        <View style={s.tearHole} />
      </View>

      <View style={s.qrSection}>
        <View style={s.qrPaper}>
          <StyledQr data={ticket.ticket_token} size={176} errorCorrectionLevel="M" />
        </View>
        <View style={s.scanHintRow}>
          <LogoMark size={13} opacity={0.85} source={LogoBlack} />
          <Text style={s.scanHint}>Scan at the door</Text>
        </View>
        <Text style={s.orderRef}>{orderRef(ticket.ticket_token)}</Text>
      </View>
    </View>
  )
}

const CARD_BG = Colors.surface
const CARD_BORDER = Colors.surfaceMuted
const QR_BG = '#ECECEC'

const s = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: CARD_BG,
    borderRadius: Radius.card + 8,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.3,
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

  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostAvatar: { width: 22, height: 22, borderRadius: 11 },
  hostAvatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hostAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 11, color: Colors.inkPrimary },
  hostRowText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    flex: 1,
  },

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

  qrSection: {
    backgroundColor: QR_BG,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 12,
  },
  qrPaper: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  scanHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanHint: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.elevated,
    textAlign: 'center',
  },
  orderRef: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: '#777',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
})

import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Calendar, MapPin, ShieldCheck, Wallet, Music2 } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { BackButton, PrimaryButton } from '@/components/ui'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hSuccess, hSelection } from '@/lib/haptics'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const BANNER_H = SCREEN_H * 0.42

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return 'Date TBC'
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  if (isNaN(d.getTime())) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function PriceRow({ label, value, total, green }: { label: string; value: string; total?: boolean; green?: boolean }) {
  return (
    <View style={pr.row}>
      <Text style={[pr.label, total && pr.totalLabel, green && { color: Colors.accentGreen }]}>{label}</Text>
      <Text style={[pr.value, total && pr.totalValue, green && { color: Colors.accentGreen }]}>{value}</Text>
    </View>
  )
}

const pr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  value: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  totalLabel: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  totalValue: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.brandOrange },
})

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletEnabled, setWalletEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => {
    if (!id) return
    Promise.all([ApiService.getEvent(id), ApiService.getWallet()])
      .then(([ev, wallet]) => {
        setEvent(ev)
        setWalletBalance(wallet.balance)
        if (ev.is_cancelled) showPill('This event has been cancelled', 'error')
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const platformFee = event ? Math.round(event.price_inr * 0.05) : 0
  const total       = event ? event.price_inr + platformFee : 0
  const walletApplied = walletEnabled ? Math.min(walletBalance, total) : 0
  const toPay = Math.max(0, total - walletApplied)

  const handlePay = async () => {
    if (!event || paying) return

    if (!event.is_free) {
      // Pass walletApplied as a param so payment screen knows what was decided here
      router.push(`/(events)/${id}/payment?wallet=${walletApplied}` as any)
      return
    }

    setPaying(true)
    try {
      const res = await ApiService.rsvpEvent(event.id, 'going')
      if (res.status === 'going') {
        router.replace(`/(events)/${id}/ticket` as any)
      } else {
        showPill("You're on the waitlist — a spot will open up soon!", 'default')
        router.back()
      }
    } catch (e: any) {
      if (e?.status === 403) {
        showPill(e?.message ?? "You don't meet the requirements for this event", 'error')
      } else {
        showPill("Booking didn't go through, try again", 'error')
      }
      setPaying(false)
    }
  }

  if (loading || !event) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  const cover = event.cover_photos?.[0]?.url
  const isCancelled = event.is_cancelled

  const payLabel = isCancelled
    ? 'Event Cancelled'
    : event.is_free
    ? 'RSVP Free'
    : toPay === 0
    ? 'Pay with Wallet'
    : walletApplied > 0
    ? `Pay ₹${toPay} + ₹${walletApplied} wallet`
    : `Pay ₹${total}`

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={s.bannerWrap}>
          {cover ? (
            <Image source={{ uri: cover }} style={s.bannerImg} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#2A2A2A', '#111']} style={[s.bannerImg, { alignItems: 'center', justifyContent: 'center' }]}>
              <Music2 size={52} color="rgba(255,107,53,0.4)" strokeWidth={1.2} />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', Colors.surface]}
            start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.backBtnWrap, { top: insets.top + 8 }]}>
            <BackButton onPress={() => router.back()} />
          </View>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.label}>Confirm Booking</Text>
          <Text style={s.title} numberOfLines={2}>{event.title}</Text>

          {/* Event summary */}
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Calendar size={14} color={Colors.inkSecondary} strokeWidth={1.8} />
              <Text style={s.summaryText}>{formatDateTime(event.date_time)}</Text>
            </View>
            {event.location_name ? (
              <View style={s.summaryRow}>
                <MapPin size={14} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.summaryText} numberOfLines={1}>{event.location_name}</Text>
              </View>
            ) : null}
          </View>

          {/* Price section */}
          {!event.is_free ? (
            <View style={s.priceSection}>
              <PriceRow label="Ticket price" value={`₹${event.price_inr}`} />
              <View style={s.priceDivider} />
              <PriceRow label="Platform fee (5%)" value={`₹${platformFee}`} />
              {walletApplied > 0 && (
                <>
                  <View style={s.priceDivider} />
                  <PriceRow label="Vybe Wallet" value={`-₹${walletApplied}`} green />
                </>
              )}
              <View style={s.priceSep} />
              <PriceRow label="To Pay" value={`₹${toPay}`} total />
            </View>
          ) : (
            <View style={s.freeTag}>
              <Text style={s.freeText}>Free event — no payment required</Text>
            </View>
          )}

          {/* Wallet toggle — only for paid events with wallet balance */}
          {!event.is_free && !isCancelled && walletBalance > 0 && (
            <View style={s.walletCard}>
              <View style={s.walletLeft}>
                <View style={s.walletIconWrap}>
                  <Wallet size={17} color={Colors.brandOrange} strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={s.walletLabel}>Vybe Wallet</Text>
                  <Text style={s.walletSub}>₹{walletBalance} available</Text>
                </View>
              </View>
              <Switch
                value={walletEnabled}
                onValueChange={v => { hSelection(); setWalletEnabled(v) }}
                trackColor={{ false: Colors.divider, true: Colors.brandOrange }}
                thumbColor="#fff"
              />
            </View>
          )}

          {/* CTA */}
          <View style={s.actions}>
            <PrimaryButton
              label={payLabel}
              onPress={() => { if (!isCancelled) { hSuccess(); handlePay() } }}
              disabled={isCancelled || paying}
              loading={paying}
            />
            {!event.is_free && !isCancelled ? (
              <View style={s.secureRow}>
                <ShieldCheck size={13} color={Colors.inkDisabled} strokeWidth={1.6} />
                <Text style={s.secureText}>Secure payment · Instant wallet refund if event is cancelled</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },

  bannerWrap: { width: SCREEN_W, height: BANNER_H, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bannerImg: { width: '100%', height: '100%' },
  bannerEmoji: { fontSize: 64 },
  backBtnWrap: { position: 'absolute', left: 0, zIndex: 10 },

  card: {
    marginTop: -Radius.modal,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    borderTopWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },

  label: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 26, letterSpacing: -0.5, color: Colors.inkPrimary, lineHeight: 32, marginBottom: Spacing.lg },

  summaryCard: { backgroundColor: Colors.elevated, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 8, marginBottom: Spacing.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, flex: 1 },

  priceSection: { backgroundColor: Colors.elevated, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.divider, padding: Spacing.md, gap: 12, marginBottom: Spacing.lg },
  priceDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },
  priceSep: { height: 1, backgroundColor: Colors.divider, marginTop: 2 },

  freeTag: { backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: Radius.card, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', paddingVertical: 14, paddingHorizontal: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  freeText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },

  walletCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.elevated, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: Spacing.md, paddingVertical: 12, marginBottom: Spacing.lg },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  walletSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },

  actions: { gap: 12 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  secureText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'center' },
})

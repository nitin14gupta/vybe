import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { hSuccess } from '@/lib/haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react-native'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

function parseDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function formatDateTime(iso: string | null | undefined) {
  const d = parseDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        if (ev.is_cancelled) showPill('This event has been cancelled', 'error')
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const platformFee = event ? Math.round(event.price_inr * 0.05) : 0
  const total = event ? event.price_inr + platformFee : 0

  const handlePay = async () => {
    if (!event || paying) return
    setPaying(true)
    try {
      if (!event.is_free) {
        await new Promise(res => setTimeout(res, 1500))
      }
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
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  const cover = event.cover_photos?.[0]?.url

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover image */}
        {cover ? (
          <Image source={{ uri: cover }} style={s.cover} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#1A1A1A', '#111']} style={[s.cover, s.coverPlaceholder]}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
          </LinearGradient>
        )}

        {/* Event title + details */}
        <Text style={s.title}>{event.title}</Text>

        <View style={s.detailRow}>
          <Calendar size={14} color={Colors.inkSecondary} />
          <Text style={s.detailText}>{formatDateTime(event.date_time)}</Text>
        </View>
        {event.location_name && (
          <View style={s.detailRow}>
            <MapPin size={14} color={Colors.inkSecondary} />
            <Text style={s.detailText}>{event.location_name}</Text>
          </View>
        )}

        {/* Price breakdown */}
        {!event.is_free && (
          <View style={s.priceCard}>
            <Text style={s.priceCardTitle}>Price Breakdown</Text>
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Ticket price</Text>
              <Text style={s.priceValue}>₹{event.price_inr}</Text>
            </View>
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Platform fee (5%)</Text>
              <Text style={s.priceValue}>₹{platformFee}</Text>
            </View>
            <View style={s.priceDivider} />
            <View style={s.priceRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>₹{total}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom pay button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[s.payBtn, event.is_cancelled && s.payBtnDisabled]}
          onPress={() => {
            if (event.is_cancelled) { showPill('This event has been cancelled', 'error'); return }
            hSuccess(); handlePay()
          }}
          disabled={paying}
        >
          <LinearGradient
            colors={event.is_cancelled ? ['#333', '#333'] : ['#FF6B35', '#FF3864']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.payGradient}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : event.is_cancelled ? (
              <Text style={s.payText}>Event Cancelled</Text>
            ) : (
              <Text style={s.payText}>
                {event.is_free ? 'RSVP Free' : `Pay ₹${total}`}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 14 },
  cover: { width: '100%', height: 200, borderRadius: 16 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, marginTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  priceCardTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  priceValue: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  priceDivider: { height: 1, backgroundColor: Colors.divider },
  totalLabel: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  totalValue: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.brandOrange },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: 'rgba(17,17,17,0.95)',
  },
  payBtn: { borderRadius: 16, overflow: 'hidden' },
  payBtnDisabled: { opacity: 0.6 },
  payGradient: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  payText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#fff' },
})

import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, Calendar, Plus } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import type { EventSummary } from '@/api/apiService'

const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉', rooftop: '🌆', game_night: '🎮',
  dinner: '🍽️', music: '🎵', other: '🔥',
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Date TBC'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return 'Date TBC'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EventCard({ event }: { event: EventSummary }) {
  const cover = event.cover_photos?.[0]?.url
  const isPast = new Date(event.date_time) < new Date()
  return (
    <Pressable
      style={[s.card, isPast && s.cardPast]}
      onPress={() => router.push(`/(events)/${event.id}` as any)}
    >
      <View style={s.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={s.image} contentFit="cover" />
        ) : (
          <View style={[s.image, s.imagePlaceholder]}>
            <Text style={{ fontSize: 28 }}>{EVENT_EMOJIS[event.event_type] ?? '🔥'}</Text>
          </View>
        )}
        {isPast && (
          <View style={s.pastBadge}>
            <Text style={s.pastBadgeText}>Past</Text>
          </View>
        )}
        {event.is_cancelled && (
          <View style={[s.pastBadge, s.cancelledBadge]}>
            <Text style={s.pastBadgeText}>Cancelled</Text>
          </View>
        )}
      </View>
      <View style={s.body}>
        <Text style={s.eventTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={s.meta}>{formatDate(event.date_time)}</Text>
        {event.location_name ? (
          <Text style={s.location} numberOfLines={1}>📍 {event.location_name}</Text>
        ) : null}
        <View style={s.bottomRow}>
          <Text style={s.attendees}>{event.attendee_count} going</Text>
          <Text style={[s.price, event.is_free && s.priceFree]}>
            {event.is_free ? 'Free' : `₹${event.price_inr}`}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await ApiService.getMyHostedEvents()
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>My Events</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/create' as any)}
          style={s.createBtn}
          hitSlop={8}
        >
          <Plus size={20} color={Colors.brandOrange} strokeWidth={2.5} />
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : events.length === 0 ? (
        <View style={s.center}>
          <Calendar size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No events yet</Text>
          <Text style={s.emptySub}>Events you host will appear here</Text>
          <Pressable style={s.ctaBtn} onPress={() => router.push('/(tabs)/create' as any)}>
            <Plus size={16} color="#111" strokeWidth={2.5} />
            <Text style={s.ctaBtnText}>Create Event</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.brandOrange} />
          }
          renderItem={({ item }) => <EventCard event={item} />}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  createBtn: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: Colors.brandOrange, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
  },
  ctaBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },
  listContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardPast: { opacity: 0.7 },
  imageWrap: { width: 100, position: 'relative' },
  image: { width: '100%', aspectRatio: 3 / 4 },
  imagePlaceholder: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  pastBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(17,17,17,0.85)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  cancelledBadge: { backgroundColor: 'rgba(255,56,100,0.85)', top: 8, left: 8 },
  pastBadgeText: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: '#fff' },
  body: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  eventTitle: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.inkPrimary, lineHeight: 19 },
  meta: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  location: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  attendees: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },
  price: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.brandOrange },
  priceFree: { color: Colors.accentGreen },
})

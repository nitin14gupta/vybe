import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ChevronLeft, Calendar, Plus } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/EventCard'

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
        <Pressable onPress={() => router.push('/(tabs)/create' as any)} style={s.createBtn} hitSlop={8}>
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
          renderItem={({ item }) => {
            const isPast = new Date(item.date_time) < new Date()
            return (
              <EventCard
                event={item}
                onPress={() => router.push(`/(events)/${item.id}` as any)}
                isPast={isPast}
                isCancelled={item.is_cancelled}
              />
            )
          }}
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
  listContent: { padding: 16, gap: 16 },
})

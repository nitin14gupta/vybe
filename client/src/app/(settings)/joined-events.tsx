import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ArrowLeft, Ticket, QrCode, ChevronRight, Ban } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import ApiService from '@/api/apiService'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/EventCard'
import { parseServerDate } from '@/lib/dates'

type Tab = 'upcoming' | 'past'

export default function JoinedEventsScreen() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<Tab>('upcoming')

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await ApiService.getMyJoinedEvents()
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const { upcoming, past } = useMemo(() => {
    const now = new Date()
    const upcoming: EventSummary[] = []
    const past: EventSummary[] = []
    for (const e of events) {
      const d = parseServerDate(e.date_time);
      (d && d < now ? past : upcoming).push(e)
    }
    upcoming.sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
    past.sort((a, b) => (parseServerDate(b.date_time)?.getTime() ?? 0) - (parseServerDate(a.date_time)?.getTime() ?? 0))
    return { upcoming, past }
  }, [events])

  const visible = tab === 'upcoming' ? upcoming : past

  return (
    <View style={s.root}>
      <AppHeader
        title="Joined Events"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <View style={s.tabs}>
        <Pressable style={[s.tab, tab === 'upcoming' && s.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[s.tabLabel, tab === 'upcoming' && s.tabLabelActive]}>Upcoming ({upcoming.length})</Text>
        </Pressable>
        <Pressable style={[s.tab, tab === 'past' && s.tabActive]} onPress={() => setTab('past')}>
          <Text style={[s.tabLabel, tab === 'past' && s.tabLabelActive]}>Past ({past.length})</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : visible.length === 0 ? (
        <View style={s.center}>
          <Ticket size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>
            {tab === 'upcoming' ? 'No upcoming tickets' : 'No past events'}
          </Text>
          <Text style={s.emptySub}>
            {tab === 'upcoming'
              ? 'Events you RSVP to will appear here'
              : "Events you've attended will show up here"}
          </Text>
          {tab === 'upcoming' && (
            <Pressable style={s.ctaBtn} onPress={() => router.navigate('/(tabs)/events')}>
              <Text style={s.ctaBtnText}>Browse Events</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={e => e.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.brandOrange} />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/(events)/${item.id}` as any)}
              showHost
              isPast={tab === 'past'}
              footer={
                tab === 'upcoming' ? (
                  <Pressable
                    style={s.ticketFooter}
                    onPress={() => router.push(`/(events)/${item.id}/ticket` as any)}
                  >
                    <QrCode size={15} color={Colors.brandOrange} strokeWidth={2} />
                    <Text style={s.ticketFooterText}>View Ticket</Text>
                    <ChevronRight size={15} color={Colors.brandOrange} strokeWidth={2} />
                  </Pressable>
                ) : (
                  <View style={s.expiredFooter}>
                    <Ban size={14} color={Colors.inkDisabled} strokeWidth={1.8} />
                    <Text style={s.expiredFooterText}>Ticket no longer valid — this event has ended</Text>
                  </View>
                )
              }
            />
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  ctaBtn: {
    marginTop: 8, backgroundColor: Colors.brandOrange,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
  },
  ctaBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },
  listContent: { padding: 16, gap: 16 },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
  },
  tabActive: { backgroundColor: Colors.brandOrange },
  tabLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  tabLabelActive: { color: '#111' },

  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.2)',
    paddingVertical: 12,
  },
  ticketFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },

  expiredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.elevated,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingVertical: 12,
  },
  expiredFooterText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
})

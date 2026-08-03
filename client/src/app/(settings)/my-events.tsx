import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ArrowLeft, Calendar, Plus, Star, ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { AppHeader, HeaderIconBtn, PrimaryButton, EventListCard, ViewModeToggle, TabSwitcher } from '@/components/ui'
import ApiService from '@/api/apiService'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { parseServerDate } from '@/lib/dates'
import { useEventViewModeStore } from '@/store/eventViewModeStore'

type Tab = 'upcoming' | 'past'

export default function MyEventsScreen() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<Tab>('upcoming')
  const viewMode = useEventViewModeStore(s => s.mode)
  const setViewMode = useEventViewModeStore(s => s.setMode)

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
        title="My Events"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
        rightAction={<HeaderIconBtn onPress={() => router.push('/(events)/create' as any)}><Plus size={20} color={Colors.brandOrange} strokeWidth={2.5} /></HeaderIconBtn>}
      />

      <View style={s.tabs}>
        <TabSwitcher
          tabs={[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past', label: `Past (${past.length})` },
          ]}
          activeTab={tab}
          onChange={t => setTab(t as Tab)}
        />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : visible.length === 0 ? (
        <View style={s.center}>
          <Calendar size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </Text>
          <Text style={s.emptySub}>
            {tab === 'upcoming'
              ? 'Events you host will appear here'
              : "Events you've hosted will show up here"}
          </Text>
          {tab === 'upcoming' && (
            <PrimaryButton
              label="Create Event"
              size="small"
              style={s.ctaBtn}
              icon={<Plus size={16} color={Colors.background} strokeWidth={2.5} />}
              onPress={() => router.push('/(events)/create' as any)}
            />
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
            viewMode === 'list' ? (
              <EventListCard event={item} onPress={() => router.push(`/(events)/${item.id}` as any)} />
            ) : (
              <EventCard
                event={item}
                onPress={() => router.push(`/(events)/${item.id}` as any)}
                isPast={tab === 'past'}
                isCancelled={item.is_cancelled}
                footer={
                  tab === 'past' ? (
                    <Pressable
                      style={s.reviewsFooter}
                      onPress={() => router.push(`/(events)/${item.id}/reviews` as any)}
                    >
                      <Star size={15} color={Colors.brandOrange} strokeWidth={2} />
                      <Text style={s.reviewsFooterText}>View Reviews</Text>
                      <ChevronRight size={15} color={Colors.brandOrange} strokeWidth={2} />
                    </Pressable>
                  ) : undefined
                }
              />
            )
          )}
        />
      )}

      {!loading && visible.length > 0 && (
        <View style={s.viewToggle}>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  ctaBtn: { marginTop: 8 },
  listContent: { padding: 16, gap: 16 },

  tabs: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },

  reviewsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  reviewsFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },

  viewToggle: { position: 'absolute', right: 16, bottom: 16 },
})
import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Ticket, QrCode, ChevronRight, Ban } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { AppHeader, HeaderIconBtn, PrimaryButton, EventListCard, EventListCardSkeleton, ViewModeToggle, SwipeableTabs } from '@/components/ui'
import ApiService from '@/api/apiService'
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard'
import { useEventViewModeStore } from '@/store/eventViewModeStore'
import { useMyEventsPage } from '@/hooks/useMyEventsPage'
import { useFocusRefresh } from '@/hooks/useFocusRefresh'

type Tab = 'upcoming' | 'past'

function EventsPane({
  tab, active, page, viewMode,
}: {
  tab: Tab
  active: boolean
  page: ReturnType<typeof useMyEventsPage>
  viewMode: 'card' | 'list'
}) {
  // Fetch once, cached after that — swiping between tabs never re-fetches.
  useEffect(() => { if (active && !page.loaded) page.fetchFirstPage(false) }, [active, page.loaded])

  if (page.loading) {
    return (
      <View style={s.listContent}>
        {Array.from({ length: 4 }).map((_, i) => (
          viewMode === 'list' ? <EventListCardSkeleton key={i} /> : <EventCardSkeleton key={i} />
        ))}
      </View>
    )
  }

  if (page.events.length === 0) {
    return (
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
          <PrimaryButton label="Browse Events" size="small" style={s.ctaBtn} onPress={() => router.navigate('/(tabs)/events')} />
        )}
      </View>
    )
  }

  return (
    <FlatList
      data={page.events}
      keyExtractor={e => e.id}
      contentContainerStyle={s.listContent}
      showsVerticalScrollIndicator={false}
      onEndReached={page.loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={page.refreshing} onRefresh={() => page.fetchFirstPage(true)} tintColor={Colors.brandOrange} />
      }
      ListFooterComponent={
        page.loadingMore ? (
          <View style={s.footerLoader}>
            <ActivityIndicator color={Colors.brandOrange} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        viewMode === 'list' ? (
          <EventListCard event={item} onPress={() => router.push(`/(events)/${item.id}` as any)} />
        ) : (
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
        )
      )}
    />
  )
}

export default function JoinedEventsScreen() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const viewMode = useEventViewModeStore(s => s.mode)
  const setViewMode = useEventViewModeStore(s => s.setMode)

  const fetchJoined = useCallback((t: Tab, limit: number, offset: number) => ApiService.getMyJoinedEventsPaged(t, limit, offset), [])
  const upcomingPage = useMyEventsPage(fetchJoined, 'upcoming')
  const pastPage = useMyEventsPage(fetchJoined, 'past')
  const active = tab === 'upcoming' ? upcomingPage : pastPage

  // Revalidate whichever tab is active on genuine screen focus (e.g. came
  // back after joining/leaving an event elsewhere) — not on tab swipes.
  const pages = { upcoming: upcomingPage, past: pastPage }
  useFocusRefresh(() => pages[tab])

  return (
    <View style={s.root}>
      <AppHeader
        title="Joined Events"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <SwipeableTabs
        tabs={[
          { key: 'upcoming', label: `Upcoming (${upcomingPage.upcomingCount})` },
          { key: 'past', label: `Past (${upcomingPage.pastCount})` },
        ]}
        activeTab={tab}
        onChange={t => setTab(t as Tab)}
      >
        {[
          <EventsPane key="upcoming" tab="upcoming" active={tab === 'upcoming'} page={upcomingPage} viewMode={viewMode} />,
          <EventsPane key="past" tab="past" active={tab === 'past'} page={pastPage} viewMode={viewMode} />,
        ]}
      </SwipeableTabs>

      {!active.loading && active.events.length > 0 && (
        <View style={s.viewToggle}>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </View>
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
  ctaBtn: { marginTop: 8 },
  listContent: { padding: 16, gap: 16 },

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

  footerLoader: { paddingVertical: 20, alignItems: 'center' },

  viewToggle: { position: 'absolute', right: 16, bottom: 16 },
})

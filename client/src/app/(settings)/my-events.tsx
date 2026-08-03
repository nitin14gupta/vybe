import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Calendar, Plus, Star, ChevronRight } from 'lucide-react-native'
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
  // Fetch once this pane is first shown — after that it's cached; swiping
  // back and forth between tabs never re-fetches. Revalidating on real
  // screen focus lives at the screen level (useFocusRefresh below), and
  // pull-to-refresh covers the manual case.
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
  )
}

export default function MyEventsScreen() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const viewMode = useEventViewModeStore(s => s.mode)
  const setViewMode = useEventViewModeStore(s => s.setMode)

  const fetchHosted = useCallback((t: Tab, limit: number, offset: number) => ApiService.getMyHostedEventsPaged(t, limit, offset), [])
  const upcomingPage = useMyEventsPage(fetchHosted, 'upcoming')
  const pastPage = useMyEventsPage(fetchHosted, 'past')
  const active = tab === 'upcoming' ? upcomingPage : pastPage

  // Revalidate whichever tab is active when the screen regains focus after
  // being navigated away from (e.g. host cancels an event, comes back) —
  // not on every in-screen swipe between tabs.
  const pages = { upcoming: upcomingPage, past: pastPage }
  useFocusRefresh(() => pages[tab])

  return (
    <View style={s.root}>
      <AppHeader
        title="My Events"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
        rightAction={<HeaderIconBtn onPress={() => router.push('/(events)/create' as any)}><Plus size={20} color={Colors.brandOrange} strokeWidth={2.5} /></HeaderIconBtn>}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  ctaBtn: { marginTop: 8 },
  listContent: { padding: 16, gap: 16 },

  reviewsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  reviewsFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },

  viewToggle: { position: 'absolute', right: 16, bottom: 16 },
})

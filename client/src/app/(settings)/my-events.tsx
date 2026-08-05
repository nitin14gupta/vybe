import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Calendar, Plus, Star, ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { AppHeader, HeaderIconBtn, ViewModeToggle, SwipeableTabs } from '@/components/ui'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { EventsPane, type EventsTab } from '@/components/settings/EventsPane'
import { useEventViewModeStore } from '@/store/eventViewModeStore'
import { useMyEventsPage } from '@/hooks/useMyEventsPage'
import { useFocusRefresh } from '@/hooks/useFocusRefresh'

export default function MyEventsScreen() {
  const [tab, setTab] = useState<EventsTab>('upcoming')
  const viewMode = useEventViewModeStore(s => s.mode)
  const setViewMode = useEventViewModeStore(s => s.setMode)

  const fetchHosted = useCallback((t: EventsTab, limit: number, offset: number) => ApiService.getMyHostedEventsPaged(t, limit, offset), [])
  const upcomingPage = useMyEventsPage(fetchHosted, 'upcoming')
  const pastPage = useMyEventsPage(fetchHosted, 'past')
  const active = tab === 'upcoming' ? upcomingPage : pastPage

  // Revalidate whichever tab is active when the screen regains focus after
  // being navigated away from (e.g. host cancels an event, comes back) —
  // not on every in-screen swipe between tabs.
  const pages = { upcoming: upcomingPage, past: pastPage }
  useFocusRefresh(() => pages[tab])

  const renderCard = (eventsTab: EventsTab) => (item: EventSummary) => (
    <EventCard
      event={item}
      onPress={() => router.push(`/(events)/${item.id}` as any)}
      isPast={eventsTab === 'past'}
      isCancelled={item.is_cancelled}
      footer={
        eventsTab === 'past' ? (
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
        onChange={t => setTab(t as EventsTab)}
      >
        {[
          <EventsPane
            key="upcoming"
            active={tab === 'upcoming'}
            page={upcomingPage}
            viewMode={viewMode}
            emptyIcon={<Calendar size={52} color={Colors.inkDisabled} strokeWidth={1.2} />}
            emptyTitle="No upcoming events"
            emptySub="Events you host will appear here"
            emptyCta={{
              label: 'Create Event',
              icon: <Plus size={16} color={Colors.background} strokeWidth={2.5} />,
              onPress: () => router.push('/(events)/create' as any),
            }}
            renderCard={renderCard('upcoming')}
          />,
          <EventsPane
            key="past"
            active={tab === 'past'}
            page={pastPage}
            viewMode={viewMode}
            emptyIcon={<Calendar size={52} color={Colors.inkDisabled} strokeWidth={1.2} />}
            emptyTitle="No past events"
            emptySub="Events you've hosted will show up here"
            renderCard={renderCard('past')}
          />,
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

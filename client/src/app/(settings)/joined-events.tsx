import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Ticket, QrCode, ChevronRight, Ban } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { AppHeader, HeaderIconBtn, ViewModeToggle, SwipeableTabs } from '@/components/ui'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { EventsPane, type EventsTab } from '@/components/settings/EventsPane'
import { useEventViewModeStore } from '@/store/eventViewModeStore'
import { useMyEventsPage } from '@/hooks/useMyEventsPage'
import { useFocusRefresh } from '@/hooks/useFocusRefresh'

export default function JoinedEventsScreen() {
  const [tab, setTab] = useState<EventsTab>('upcoming')
  const viewMode = useEventViewModeStore(s => s.mode)
  const setViewMode = useEventViewModeStore(s => s.setMode)

  const fetchJoined = useCallback((t: EventsTab, limit: number, offset: number) => ApiService.getMyJoinedEventsPaged(t, limit, offset), [])
  const upcomingPage = useMyEventsPage(fetchJoined, 'upcoming')
  const pastPage = useMyEventsPage(fetchJoined, 'past')
  const active = tab === 'upcoming' ? upcomingPage : pastPage

  // Revalidate whichever tab is active on genuine screen focus (e.g. came
  // back after joining/leaving an event elsewhere) — not on tab swipes.
  const pages = { upcoming: upcomingPage, past: pastPage }
  useFocusRefresh(() => pages[tab])

  const renderCard = (eventsTab: EventsTab) => (item: EventSummary) => (
    <EventCard
      event={item}
      onPress={() => router.push(`/(events)/${item.id}` as any)}
      showHost
      isPast={eventsTab === 'past'}
      footer={
        eventsTab === 'upcoming' ? (
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
        onChange={t => setTab(t as EventsTab)}
      >
        {[
          <EventsPane
            key="upcoming"
            active={tab === 'upcoming'}
            page={upcomingPage}
            viewMode={viewMode}
            emptyIcon={<Ticket size={52} color={Colors.inkDisabled} strokeWidth={1.2} />}
            emptyTitle="No upcoming tickets"
            emptySub="Events you RSVP to will appear here"
            emptyCta={{ label: 'Browse Events', onPress: () => router.navigate('/(tabs)/events') }}
            renderCard={renderCard('upcoming')}
          />,
          <EventsPane
            key="past"
            active={tab === 'past'}
            page={pastPage}
            viewMode={viewMode}
            emptyIcon={<Ticket size={52} color={Colors.inkDisabled} strokeWidth={1.2} />}
            emptyTitle="No past events"
            emptySub="Events you've attended will show up here"
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

  viewToggle: { position: 'absolute', right: 16, bottom: 16 },
})

import { useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { ArrowLeft, Calendar, Plus, Star, ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { AppHeader, HeaderIconBtn, PrimaryButton, TabSwitcher, ViewModeToggle, EventListCard } from '@/components/ui'
import ApiService from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { useEventViewModeStore } from '@/store/eventViewModeStore'
import { useMyEventsList } from '@/hooks/useMyEventsList'

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets()
  const { mode: viewMode, setMode: setViewMode } = useEventViewModeStore()
  const {
    tab, setTab, events, upcomingCount, pastCount,
    loading, loadingMore, refreshing, hasMore, load, loadMore,
  } = useMyEventsList(ApiService.getMyHostedEventsPaged, viewMode)

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <View style={s.root}>
      <AppHeader
        title="My Events"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
        rightAction={<HeaderIconBtn onPress={() => router.push('/(events)/create' as any)}><Plus size={20} color={Colors.brandOrange} strokeWidth={2.5} /></HeaderIconBtn>}
      />

      <View style={s.tabsRow}>
        <TabSwitcher
          variant="underline"
          tabs={[`Upcoming (${upcomingCount})`, `Past (${pastCount})`]}
          activeTab={tab === 'upcoming' ? `Upcoming (${upcomingCount})` : `Past (${pastCount})`}
          onChange={(t) => setTab(t.startsWith('Upcoming') ? 'upcoming' : 'past')}
        />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : events.length === 0 ? (
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
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.brandOrange} />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={s.loadingMore} color={Colors.inkSecondary} /> : null
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

      {!loading && events.length > 0 && (
        <View style={[s.viewModeFab, { bottom: insets.bottom + 16 }]}>
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
  listContent: { padding: 16, paddingBottom: 84, gap: 16 },
  loadingMore: { paddingVertical: 16 },

  tabsRow: {
    paddingHorizontal: 16,
  },

  viewModeFab: {
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  reviewsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  reviewsFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },
})

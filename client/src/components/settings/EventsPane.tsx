import { useEffect, type ReactNode, type ReactElement } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Colors, FontFamily } from '@/constants'
import { EventListCard, EventListCardSkeleton, PrimaryButton, BrandedRefreshControl } from '@/components/ui'
import { EventCardSkeleton } from '@/components/events/EventCard'
import type { useMyEventsPage } from '@/hooks/useMyEventsPage'
import type { EventSummary } from '@/api/apiService'

export type EventsTab = 'upcoming' | 'past'

export function EventsPane({
  active, page, viewMode, emptyIcon, emptyTitle, emptySub, emptyCta, renderCard,
}: {
  active: boolean
  page: ReturnType<typeof useMyEventsPage>
  viewMode: 'card' | 'list'
  emptyIcon: ReactNode
  emptyTitle: string
  emptySub: string
  emptyCta?: { label: string; icon?: ReactNode; onPress: () => void }
  renderCard: (item: EventSummary) => ReactElement
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
        {emptyIcon}
        <Text style={s.emptyTitle}>{emptyTitle}</Text>
        <Text style={s.emptySub}>{emptySub}</Text>
        {emptyCta && (
          <PrimaryButton label={emptyCta.label} icon={emptyCta.icon} size="small" style={s.ctaBtn} onPress={emptyCta.onPress} />
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
        <BrandedRefreshControl refreshing={page.refreshing} onRefresh={() => page.fetchFirstPage(true)} />
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
          renderCard(item)
        )
      )}
    />
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  ctaBtn: { marginTop: 8 },
  listContent: { padding: 16, gap: 16 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
})

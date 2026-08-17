import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bookmark } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function HotlistScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await ApiService.getMyHotlistEvents()
      setEvents(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <View style={s.root}>
      <AppHeader
        title="Hotlist"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <ActivityIndicator color={Colors.inkSecondary} />
        </View>
      ) : events.length === 0 ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <Bookmark size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Your hotlist is empty</Text>
          <Text style={s.emptySub}>Tap the save icon on any event to add it here for later.</Text>
          <PrimaryButton label="Browse Events" size="small" style={s.emptyCta} onPress={() => router.navigate('/(tabs)/events')} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={[s.list, { paddingTop: headerHeight + 8 }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => router.push(`/(events)/${item.id}` as any)} />
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  emptyCta: { marginTop: 4, minWidth: 180 },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, gap: 16 },
})

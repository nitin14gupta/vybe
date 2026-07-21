import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Modal, FlatList, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { X, Flame, SlidersHorizontal } from 'lucide-react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { hTap, hSelection } from '@/lib/haptics'
import { Colors, FontFamily, FILTER_CHIPS, matchesChip } from '@/constants'
import { Screen, SearchBar } from '@/components/ui'
import { EventCard } from './EventCard'
import { useEventSearch } from '@/hooks/useEventSearch'
import type { EventSummary } from '@/api/apiService'

interface Props {
  visible: boolean
  onClose: () => void
  nearbyEvents: EventSummary[]
  lat?: number | null
  lng?: number | null
  nearbyLoading?: boolean
}

export function EventSearchModal({ visible, onClose, nearbyEvents, lat, lng, nearbyLoading }: Props) {
  const {
    query, setQuery,
    chipKey, setChipKey,
    results, loading, searched, searchError,
    hostedEvents, hostedLoading, fetchHostedOnce,
  } = useEventSearch(lat, lng)

  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (visible) fetchHostedOnce()
  }, [visible])

  const openEvent = (id: string) => {
    router.push(`/(events)/${id}` as any)
    onClose()
  }

  const isSearching = query.trim().length > 0
  const hostedIds = new Set(hostedEvents.map(e => e.id))
  const nearbyFiltered = nearbyEvents
    .filter(e => !hostedIds.has(e.id))
    .filter(e => matchesChip(e, chipKey))
    .slice(0, 12)

  const renderCard = (item: EventSummary) => (
    <View style={s.cardWrap}>
      <EventCard event={item} onPress={() => openEvent(item.id)} showHost />
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Screen bottom={false}>
        <View style={s.header}>
          <Pressable onPress={() => { hTap(); onClose() }} style={s.iconBtn}>
            <X size={20} color="#fff" />
          </Pressable>
          <Text style={s.title}>Search Events</Text>
          <View style={{ width: 38 }} />
        </View>

        <SearchBar
          variant="glass"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or location"
          autoFocus
          style={s.searchWrap}
          rightSlot={
            <Pressable
              onPress={() => { hSelection(); setFiltersOpen(v => !v) }}
              style={[s.filterIconBtn, (filtersOpen || chipKey !== 'all') && s.filterIconBtnActive]}
              hitSlop={8}
            >
              <SlidersHorizontal size={16} color={filtersOpen || chipKey !== 'all' ? '#fff' : Colors.glassTextDisabled} strokeWidth={2} />
            </Pressable>
          }
        />

        {filtersOpen && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipsScroll}
            contentContainerStyle={s.chipsRow}
          >
            {FILTER_CHIPS.map(chip => (
              <Pressable
                key={chip.key}
                onPress={() => { hSelection(); setChipKey(chip.key) }}
                style={[s.chip, chipKey === chip.key && s.chipActive]}
              >
                <Text style={[s.chipText, chipKey === chip.key && s.chipTextActive]}>{chip.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {isSearching ? (
          loading ? (
            <AutoSkeletonView isLoading animationType="gradient" defaultRadius={14} gradientColors={['#1e1e1e', '#2e2e2e']}>
              <View style={s.listContent}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={s.skCard} />
                ))}
              </View>
            </AutoSkeletonView>
          ) : searchError ? (
            <View style={s.center}>
              <Text style={s.emptyTitle}>Search failed</Text>
              <Text style={s.emptySub}>Check your connection and try again</Text>
            </View>
          ) : searched && results.length === 0 ? (
            <View style={s.center}>
              <Flame size={44} color={Colors.glassTextDisabled} strokeWidth={1.2} />
              <Text style={s.emptyTitle}>No events found</Text>
              <Text style={s.emptySub}>Try a different name or location</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={e => e.id}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => renderCard(item)}
            />
          )
        ) : (
          <FlatList
            data={nearbyFiltered}
            keyExtractor={e => e.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              chipKey === 'all' && hostedEvents.length > 0 ? (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Hosted ({hostedEvents.length})</Text>
                  {hostedEvents.map(item => (
                    <View key={item.id}>{renderCard(item)}</View>
                  ))}
                  <Text style={[s.sectionTitle, { marginTop: 8 }]}>Nearby Events</Text>
                </View>
              ) : (
                <Text style={s.sectionTitle}>Nearby Events</Text>
              )
            }
            ListEmptyComponent={
              !hostedLoading && !nearbyLoading ? (
                <View style={s.center}>
                  <Text style={s.emptyTitle}>No events nearby yet</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => renderCard(item)}
          />
        )}
      </Screen>
    </Modal>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glassSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, color: '#fff' },

  searchWrap: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 12,
  },
  filterIconBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  filterIconBtnActive: { backgroundColor: Colors.brandOrange },

  chipsScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 8 },
  chipsRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.glassSurface,
    borderRadius: 20,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  chipActive: { backgroundColor: Colors.brandOrange, borderColor: Colors.brandOrange },
  chipText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: '#fff' },
  chipTextActive: { color: '#fff', fontFamily: FontFamily.bodySemiBold },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  section: { gap: 12 },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.glassTextSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },

  cardWrap: { marginBottom: 4 },
  skCard: { height: 220, borderRadius: 20, marginBottom: 16 },

  center: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: '#fff' },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.glassTextSecondary, textAlign: 'center' },
})
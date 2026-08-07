import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import {
  BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput, BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, ChevronRight, Check, MapPin, Search, PartyPopper, Users, Clock3 } from 'lucide-react-native'
import { hTap, hSelection, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import { useCities, type CityResponse } from '@/hooks/useCities'
import { DEFAULT_CALENDAR_FILTERS, type CalendarFilters } from '@/hooks/useCalendarEvents'

const SNAP_POINTS = ['62%']

interface Props {
  visible: boolean
  filters: CalendarFilters
  onApply: (f: CalendarFilters) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

// Pill toggle instead of a checkbox row — matches AttendeeFilterPills'
// language elsewhere in the app. Neutral (white-on-dark) when active, not
// brand-colored — orange stays reserved for the single Apply CTA below.
function TogglePill({ Icon, label, active, onPress }: {
  Icon: any
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={[s.pill, active && s.pillActive]} onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
      <Icon size={16} color={active ? '#111' : Colors.inkSecondary} strokeWidth={2.2} />
      <Text style={[s.pillLabel, active && s.pillLabelActive]}>{label}</Text>
    </Pressable>
  )
}

const CityRow = memo(function CityRow({ city, selected, onPress }: {
  city: CityResponse
  selected: boolean
  onPress: (city: CityResponse) => void
}) {
  const handlePress = useCallback(() => onPress(city), [onPress, city])
  return (
    <Pressable style={s.cityRow} onPress={handlePress} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
      <View>
        <Text style={[s.cityName, selected && s.cityNameSelected]}>{city.name}</Text>
        <Text style={s.cityState}>{city.state}</Text>
      </View>
      {selected && <Check size={18} color={Colors.inkPrimary} strokeWidth={2.5} />}
    </Pressable>
  )
})

function CalendarFilterSheetCore({ filters, onApply, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [draft, setDraft] = useState<CalendarFilters>(filters)
  const [view, setView] = useState<'filters' | 'city'>('filters')
  const [query, setQuery] = useState('')
  const [citySearchFocused, setCitySearchFocused] = useState(false)
  const { cities } = useCities()

  useEffect(() => { sheetRef.current?.present() }, [])

  const reset = () => { hTap(); setDraft(DEFAULT_CALENDAR_FILTERS) }

  const apply = () => {
    hSuccess()
    onApply(draft)
    sheetRef.current?.dismiss()
  }

  const pickCity = useCallback((city: CityResponse | null) => {
    hSelection()
    setDraft(d => ({ ...d, city }))
    setView('filters')
    setQuery('')
  }, [])

  const filteredCities = useMemo(() => {
    const q = query.toLowerCase()
    return cities.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q),
    )
  }, [cities, query])

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      {view === 'filters' ? (
        <>
          <View style={s.header}>
            <Text style={s.title}>Filters</Text>
            <Pressable onPress={reset}><Text style={s.resetText}>Reset</Text></Pressable>
          </View>

          <View style={s.body}>
            <View style={s.section}>
              <Text style={s.sectionLabel}>SHOW</Text>
              <View style={s.pillRow}>
                <TogglePill
                  Icon={PartyPopper}
                  label="Hosting"
                  active={draft.showHosted}
                  onPress={() => { hSelection(); setDraft(d => ({ ...d, showHosted: !d.showHosted })) }}
                />
                <TogglePill
                  Icon={Users}
                  label="Going"
                  active={draft.showGoing}
                  onPress={() => { hSelection(); setDraft(d => ({ ...d, showGoing: !d.showGoing })) }}
                />
                <TogglePill
                  Icon={Clock3}
                  label="Waitlisted"
                  active={draft.showWaitlisted}
                  onPress={() => { hSelection(); setDraft(d => ({ ...d, showWaitlisted: !d.showWaitlisted })) }}
                />
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionLabel}>LOCATION</Text>
              <Pressable style={s.locationCard} onPress={() => { hTap(); setView('city') }} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
                <View style={s.rowLeft}>
                  <MapPin size={18} color={Colors.inkSecondary} strokeWidth={2} />
                  <Text style={s.rowLabel}>{draft.city ? draft.city.name : 'All cities'}</Text>
                </View>
                <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <Pressable onPress={apply} style={s.applyWrap}>
            <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.applyBtn}>
              <Text style={s.applyText}>Apply Filters</Text>
            </LinearGradient>
          </Pressable>
        </>
      ) : (
        <>
          <View style={s.header}>
            <Pressable onPress={() => { hTap(); setView('filters'); setQuery('') }} hitSlop={8} style={s.backBtn}>
              <ChevronLeft size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
            </Pressable>
            <Text style={s.title}>Location</Text>
            <View style={{ width: 20 }} />
          </View>

          <View style={[s.searchWrap, citySearchFocused && s.searchWrapFocused]}>
            <Search size={16} color={Colors.inkSecondary} strokeWidth={2} />
            <BottomSheetTextInput
              placeholder="Search cities…"
              placeholderTextColor={Colors.inkDisabled}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setCitySearchFocused(true)}
              onBlur={() => setCitySearchFocused(false)}
              style={s.searchInput}
            />
          </View>

          <BottomSheetFlatList
            data={filteredCities}
            keyExtractor={c => c.name}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.cityList}
            ListHeaderComponent={
              <Pressable style={s.cityRow} onPress={() => pickCity(null)} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
                <Text style={[s.cityName, !draft.city && s.cityNameSelected]}>All cities</Text>
                {!draft.city && <Check size={18} color={Colors.inkPrimary} strokeWidth={2.5} />}
              </Pressable>
            }
            renderItem={({ item }) => (
              <CityRow city={item} selected={draft.city?.name === item.name} onPress={pickCity} />
            )}
          />
        </>
      )}
    </BottomSheetModal>
  )
}

export function CalendarFilterSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <CalendarFilterSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.2)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 12,
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  resetText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  backBtn: { width: 20 },

  body: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16, gap: 26 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 12, letterSpacing: 0.8,
    color: Colors.inkSecondary,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.divider,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: Colors.inkPrimary,
    borderColor: Colors.inkPrimary,
  },
  pillLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  pillLabelActive: { color: '#111', fontFamily: FontFamily.bodySemiBold },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary },

  applyWrap: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 24 },
  applyBtn: { borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center' },
  applyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#fff', letterSpacing: 0.3 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.screenPadding, marginBottom: 10,
    height: 46, borderRadius: Radius.input, backgroundColor: Colors.elevated,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 14,
  },
  searchWrapFocused: { borderColor: Colors.inkSecondary },
  searchInput: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },

  cityList: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 24 },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  cityName: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginBottom: 2 },
  cityNameSelected: { color: Colors.inkPrimary },
  cityState: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
})

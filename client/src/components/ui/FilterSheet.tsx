import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, PanResponder, Dimensions } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { LinearGradient } from 'expo-linear-gradient'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import type { DiscoverFilters } from '@/hooks/useDiscover'

const GENDER_OPTIONS = ['Everyone', 'Women', 'Men'] as const
type GenderOpt = typeof GENDER_OPTIONS[number]

const genderToFilter: Record<GenderOpt, string | undefined> = { Everyone: undefined, Women: 'Woman', Men: 'Man' }
const filterToGender = (g?: string): GenderOpt => g === 'Woman' ? 'Women' : g === 'Man' ? 'Men' : 'Everyone'

interface Props {
  visible: boolean
  filters: DiscoverFilters
  onApply: (f: DiscoverFilters) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function FilterSheetCore({ filters, onApply, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [gender, setGender] = useState<GenderOpt>(filterToGender(filters.gender))
  const [minAge, setMinAge] = useState(filters.minAge ?? 18)
  const [maxAge, setMaxAge] = useState(filters.maxAge ?? 45)
  const [maxDist, setMaxDist] = useState(filters.maxDistanceKm ?? 50)

  useEffect(() => { sheetRef.current?.present() }, [])

  const reset = () => { hTap(); setGender('Everyone'); setMinAge(18); setMaxAge(45); setMaxDist(50) }

  const apply = () => {
    hSuccess()
    onApply({
      gender: genderToFilter[gender],
      minAge: minAge === 18 ? undefined : minAge,
      maxAge: maxAge === 45 ? undefined : maxAge,
      maxDistanceKm: maxDist === 50 ? undefined : maxDist,
    })
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['55%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <View style={s.header}>
        <Text style={s.title}>Filters</Text>
        <Pressable onPress={reset}><Text style={s.resetText}>Reset</Text></Pressable>
      </View>

      <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        <View style={s.section}>
          <Text style={s.sectionLabel}>Show me</Text>
          <View style={s.segRow}>
            {GENDER_OPTIONS.map(opt => (
              <Pressable key={opt} onPress={() => { hSelection(); setGender(opt) }} style={[s.segBtn, gender === opt && s.segBtnActive]}>
                <Text style={[s.segText, gender === opt && s.segTextActive]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>Age range</Text>
            <Text style={s.valueLabel}>{minAge} – {maxAge === 45 ? '45+' : maxAge}</Text>
          </View>
          <AgeSlider minAge={minAge} maxAge={maxAge} onChangeMin={setMinAge} onChangeMax={setMaxAge} />
        </View>

        <View style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>Max distance</Text>
            <Text style={s.valueLabel}>{maxDist === 50 ? 'Any' : `${maxDist} km`}</Text>
          </View>
          <SingleSlider value={maxDist} min={1} max={50} onChange={setMaxDist} />
        </View>
      </BottomSheetScrollView>

      <Pressable onPress={apply} style={s.applyWrap}>
        <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.applyBtn}>
          <Text style={s.applyText}>Apply Filters</Text>
        </LinearGradient>
      </Pressable>
    </BottomSheetModal>
  )
}

export function FilterSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <FilterSheetCore {...rest} />
}

// ── Sliders ────────────────────────────────────────────────────────────────

const TRACK_W = Dimensions.get('window').width - Spacing.screenPadding * 2 - 32

function SingleSlider({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const pct = (value - min) / (max - min)
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const p = Math.max(0, Math.min(1, (g.moveX - Spacing.screenPadding - 16) / TRACK_W))
      onChange(Math.round(min + p * (max - min)))
    },
  })).current
  return (
    <View style={sl.track} {...pan.panHandlers}>
      <View style={[sl.fill, { width: `${pct * 100}%` }]} />
      <View style={[sl.thumb, { left: `${pct * 100}%` }]} />
    </View>
  )
}

function AgeSlider({ minAge, maxAge, onChangeMin, onChangeMax }: { minAge: number; maxAge: number; onChangeMin: (v: number) => void; onChangeMax: (v: number) => void }) {
  const AGE_MIN = 18, AGE_MAX = 45
  const pctMin = (minAge - AGE_MIN) / (AGE_MAX - AGE_MIN)
  const pctMax = (maxAge - AGE_MIN) / (AGE_MAX - AGE_MIN)
  const minPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const p = Math.max(0, Math.min(1, (g.moveX - Spacing.screenPadding - 16) / TRACK_W))
      const v = Math.round(AGE_MIN + p * (AGE_MAX - AGE_MIN))
      if (v < maxAge) onChangeMin(v)
    },
  })).current
  const maxPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const p = Math.max(0, Math.min(1, (g.moveX - Spacing.screenPadding - 16) / TRACK_W))
      const v = Math.round(AGE_MIN + p * (AGE_MAX - AGE_MIN))
      if (v > minAge) onChangeMax(v)
    },
  })).current
  return (
    <View style={sl.track}>
      <View style={[sl.fill, { left: `${pctMin * 100}%`, width: `${(pctMax - pctMin) * 100}%` }]} />
      <View style={[sl.thumb, { left: `${pctMin * 100}%` }]} {...minPan.panHandlers} />
      <View style={[sl.thumb, { left: `${pctMax * 100}%` }]} {...maxPan.panHandlers} />
    </View>
  )
}

const sl = StyleSheet.create({
  track: { height: 4, backgroundColor: Colors.elevated, borderRadius: 2, marginTop: 14, position: 'relative' },
  fill: { position: 'absolute', top: 0, height: 4, backgroundColor: Colors.brandOrange, borderRadius: 2 },
  thumb: { position: 'absolute', top: -10, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.brandOrange, shadowColor: Colors.brandOrange, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
})

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: Colors.elevated },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: 12 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  resetText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },
  body: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16, gap: 28 },
  section: { gap: 4 },
  sectionLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary, marginBottom: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  segRow: { flexDirection: 'row', backgroundColor: Colors.elevated, borderRadius: Radius.input, padding: 3, gap: 2, marginTop: 8 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.input - 2 },
  segBtnActive: { backgroundColor: Colors.brandOrange },
  segText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  segTextActive: { color: '#fff', fontFamily: FontFamily.bodySemiBold },
  applyWrap: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 24 },
  applyBtn: { borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center' },
  applyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#fff', letterSpacing: 0.3 },
})

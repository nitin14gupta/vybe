import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Modal, View, Text, StyleSheet, Pressable,
  Animated, PanResponder, Dimensions, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import type { DiscoverFilters } from '@/hooks/useDiscover'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.62

const GENDER_OPTIONS = ['Everyone', 'Women', 'Men'] as const
type GenderOpt = typeof GENDER_OPTIONS[number]

const genderToFilter: Record<GenderOpt, string | undefined> = {
  Everyone: undefined,
  Women: 'Woman',
  Men: 'Man',
}

const filterToGender = (g?: string): GenderOpt => {
  if (g === 'Woman') return 'Women'
  if (g === 'Man') return 'Men'
  return 'Everyone'
}

interface Props {
  visible: boolean
  filters: DiscoverFilters
  onApply: (f: DiscoverFilters) => void
  onClose: () => void
}

export function FilterSheet({ visible, filters, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const slideY = useRef(new Animated.Value(SHEET_H)).current

  const [gender, setGender] = useState<GenderOpt>(filterToGender(filters.gender))
  const [minAge, setMinAge] = useState(filters.minAge ?? 18)
  const [maxAge, setMaxAge] = useState(filters.maxAge ?? 45)
  const [maxDist, setMaxDist] = useState(filters.maxDistanceKm ?? 50)

  // Sync with incoming filters when sheet opens
  useEffect(() => {
    if (visible) {
      setGender(filterToGender(filters.gender))
      setMinAge(filters.minAge ?? 18)
      setMaxAge(filters.maxAge ?? 45)
      setMaxDist(filters.maxDistanceKm ?? 50)
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
    } else {
      Animated.timing(slideY, { toValue: SHEET_H, duration: 220, useNativeDriver: true }).start()
    }
  }, [visible, filters])

  const close = useCallback(() => {
    Animated.timing(slideY, { toValue: SHEET_H, duration: 220, useNativeDriver: true }).start(onClose)
  }, [onClose])

  const reset = () => {
    setGender('Everyone')
    setMinAge(18)
    setMaxAge(45)
    setMaxDist(50)
  }

  const apply = () => {
    onApply({
      gender: genderToFilter[gender],
      minAge: minAge === 18 ? undefined : minAge,
      maxAge: maxAge === 45 ? undefined : maxAge,
      maxDistanceKm: maxDist === 50 ? undefined : maxDist,
    })
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideY.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(slideY, { toValue: SHEET_H, duration: 200, useNativeDriver: true }).start(onClose)
        } else {
          Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
        }
      },
    })
  ).current

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={close} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }], paddingBottom: insets.bottom + 16 }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={reset}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

          {/* Show me */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Show me</Text>
            <View style={styles.segRow}>
              {GENDER_OPTIONS.map(opt => (
                <Pressable
                  key={opt}
                  onPress={() => setGender(opt)}
                  style={[styles.segBtn, gender === opt && styles.segBtnActive]}
                >
                  <Text style={[styles.segText, gender === opt && styles.segTextActive]}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Age range */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>Age range</Text>
              <Text style={styles.valueLabel}>{minAge} – {maxAge === 45 ? '45+' : maxAge}</Text>
            </View>
            <AgeSlider minAge={minAge} maxAge={maxAge} onChangeMin={setMinAge} onChangeMax={setMaxAge} />
          </View>

          {/* Max distance */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>Max distance</Text>
              <Text style={styles.valueLabel}>{maxDist === 50 ? 'Any' : `${maxDist} km`}</Text>
            </View>
            <SingleSlider value={maxDist} min={1} max={50} onChange={setMaxDist} />
          </View>

        </ScrollView>

        {/* Apply button */}
        <Pressable onPress={apply} style={styles.applyWrap}>
          <LinearGradient
            colors={[Colors.brandOrange, Colors.brandCoral]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.applyBtn}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Modal>
  )
}

// ── Simple single-thumb slider ─────────────────────────────────────────────

const TRACK_W = Dimensions.get('window').width - Spacing.screenPadding * 2 - 32

function SingleSlider({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (v: number) => void
}) {
  const pct = (value - min) / (max - min)

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const newPct = Math.max(0, Math.min(1, (g.moveX - Spacing.screenPadding - 16) / TRACK_W))
        onChange(Math.round(min + newPct * (max - min)))
      },
    })
  ).current

  return (
    <View style={slStyles.track} {...pan.panHandlers}>
      <View style={[slStyles.fill, { width: `${pct * 100}%` }]} />
      <View style={[slStyles.thumb, { left: `${pct * 100}%` }]} />
    </View>
  )
}

// ── Two-thumb age slider ───────────────────────────────────────────────────

function AgeSlider({ minAge, maxAge, onChangeMin, onChangeMax }: {
  minAge: number; maxAge: number; onChangeMin: (v: number) => void; onChangeMax: (v: number) => void
}) {
  const AGE_MIN = 18
  const AGE_MAX = 45
  const pctMin = (minAge - AGE_MIN) / (AGE_MAX - AGE_MIN)
  const pctMax = (maxAge - AGE_MIN) / (AGE_MAX - AGE_MIN)

  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const p = Math.max(0, Math.min(1, (g.moveX - Spacing.screenPadding - 16) / TRACK_W))
        const v = Math.round(AGE_MIN + p * (AGE_MAX - AGE_MIN))
        if (v < maxAge) onChangeMin(v)
      },
    })
  ).current

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const p = Math.max(0, Math.min(1, (g.moveX - Spacing.screenPadding - 16) / TRACK_W))
        const v = Math.round(AGE_MIN + p * (AGE_MAX - AGE_MIN))
        if (v > minAge) onChangeMax(v)
      },
    })
  ).current

  return (
    <View style={slStyles.track}>
      {/* Filled range between thumbs */}
      <View style={[
        slStyles.fill,
        { left: `${pctMin * 100}%`, width: `${(pctMax - pctMin) * 100}%` }
      ]} />
      <View style={[slStyles.thumb, { left: `${pctMin * 100}%` }]} {...minPan.panHandlers} />
      <View style={[slStyles.thumb, { left: `${pctMax * 100}%` }]} {...maxPan.panHandlers} />
    </View>
  )
}

const slStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: Colors.elevated,
    borderRadius: 2,
    marginTop: 14,
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    height: 4,
    backgroundColor: Colors.brandOrange,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -10,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brandOrange,
    shadowColor: Colors.brandOrange,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
})

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
  },
  resetText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.brandOrange,
  },
  body: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
    gap: 28,
  },
  section: { gap: 4 },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkSecondary,
    marginBottom: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  segRow: {
    flexDirection: 'row',
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    padding: 3,
    gap: 2,
    marginTop: 8,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.input - 2,
  },
  segBtnActive: {
    backgroundColor: Colors.brandOrange,
  },
  segText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  segTextActive: {
    color: '#fff',
    fontFamily: FontFamily.bodySemiBold,
  },
  applyWrap: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
  },
  applyBtn: {
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.3,
  },
})

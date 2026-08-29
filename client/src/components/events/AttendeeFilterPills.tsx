import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Colors, FontFamily, Spacing, Radius, withOpacity } from '@/constants'

export type AttendeeFilter = 'all' | 'checked_in' | 'not_arrived'

const PILL_LABELS: Record<AttendeeFilter, string> = {
  all: 'All',
  checked_in: 'Checked In',
  not_arrived: 'Not Arrived',
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function FilterPill({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      onPress={onPress}
      android_ripple={null}
      style={[p.pill, active && p.pillActive, pressStyle]}
      onPressIn={() => { pressScale.value = withSpring(0.95, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
    >
      <Text style={[p.label, active && p.labelActive]}>{label}</Text>
      <View style={[p.badge, active && p.badgeActive]}>
        <Text style={[p.badgeNum, active && p.badgeNumActive]}>{count}</Text>
      </View>
    </AnimatedPressable>
  )
}

export function AttendeeFilterPills({
  active,
  counts,
  onChange,
}: {
  active: AttendeeFilter
  counts: Record<AttendeeFilter, number>
  onChange: (f: AttendeeFilter) => void
}) {
  return (
    <View style={p.wrap}>
      {(Object.keys(PILL_LABELS) as AttendeeFilter[]).map(f => (
        <FilterPill
          key={f}
          label={PILL_LABELS[f]}
          count={counts[f]}
          active={f === active}
          onPress={() => onChange(f)}
        />
      ))}
    </View>
  )
}

const p = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: Colors.brandOrange,
    borderColor: Colors.brandOrange,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  labelActive: { color: Colors.inkPrimary },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: { backgroundColor: withOpacity(Colors.inkPrimary, 0.25) },
  badgeNum: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.inkSecondary,
  },
  badgeNumActive: { color: Colors.inkPrimary },
})

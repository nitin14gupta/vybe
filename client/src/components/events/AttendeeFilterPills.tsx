import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, FontFamily, Spacing, Radius, withOpacity } from '@/constants'

export type AttendeeFilter = 'all' | 'checked_in' | 'not_arrived'

const PILL_LABELS: Record<AttendeeFilter, string> = {
  all: 'All',
  checked_in: 'Checked In',
  not_arrived: 'Not Arrived',
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
      {(Object.keys(PILL_LABELS) as AttendeeFilter[]).map(f => {
        const isActive = f === active
        return (
          <Pressable
            key={f}
            onPress={() => onChange(f)}
            android_ripple={null}
            style={[p.pill, isActive && p.pillActive]}
          >
            <Text style={[p.label, isActive && p.labelActive]}>
              {PILL_LABELS[f]}
            </Text>
            <View style={[p.badge, isActive && p.badgeActive]}>
              <Text style={[p.badgeNum, isActive && p.badgeNumActive]}>
                {counts[f]}
              </Text>
            </View>
          </Pressable>
        )
      })}
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

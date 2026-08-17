import { View, Text, StyleSheet, Pressable } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { dateKey } from '@/hooks/useCalendarEvents'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { hTap } from '@/lib/haptics'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface CalendarMonthGridProps {
  visibleMonth: Date
  today: Date
  selectedKey: string
  gridWeeks: (Date | null)[][]
  hasEventsOnDate: (key: string) => boolean
  onShiftMonth: (delta: number) => void
  onGoToday: () => void
  onSelectDate: (d: Date) => void
}

export function CalendarMonthGrid({
  visibleMonth, today, selectedKey, gridWeeks, hasEventsOnDate,
  onShiftMonth, onGoToday, onSelectDate,
}: CalendarMonthGridProps) {
  const todayKey = dateKey(today)

  return (
    <>
      <View style={s.monthRow}>
        <Pressable onPress={() => { hTap(); onShiftMonth(-1) }} hitSlop={10} style={s.monthArrow}>
          <ChevronLeft size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
        <Text style={s.monthTitle}>{MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text>
        <Pressable onPress={() => { hTap(); onShiftMonth(1) }} hitSlop={10} style={s.monthArrow}>
          <ChevronRight size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onGoToday} style={s.todayBtn}>
          <Text style={s.todayBtnText}>Today</Text>
        </Pressable>
      </View>

      <View style={s.weekHeader}>
        {WEEKDAYS.map(w => <Text key={w} style={s.weekHeaderText}>{w}</Text>)}
      </View>

      <View style={s.grid}>
        {gridWeeks.map((week, wi) => (
          <View key={wi} style={s.weekRow}>
            {week.map((d, di) => {
              if (!d) return <View key={di} style={s.dayCell} />
              const k = dateKey(d)
              const isSelected = k === selectedKey
              const isToday = k === todayKey
              const hasDot = k >= todayKey && hasEventsOnDate(k)
              return (
                <Pressable key={di} style={s.dayCell} onPress={() => onSelectDate(d)}>
                  <View style={[s.dayCircle, isSelected && s.dayCircleSelected]}>
                    <Text style={[s.dayText, isToday && !isSelected && s.dayTextToday, isSelected && s.dayTextSelected]}>
                      {d.getDate()}
                    </Text>
                  </View>
                  <View style={[s.dot, hasDot && (isSelected ? s.dotSelected : s.dotVisible)]} />
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </>
  )
}

const s = StyleSheet.create({
  monthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.screenPadding, paddingTop: 6, paddingBottom: 12,
  },
  monthArrow: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginRight: 2 },
  todayBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  todayBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },

  weekHeader: { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding, marginBottom: 4 },
  weekHeaderText: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled,
  },

  grid: { paddingHorizontal: Spacing.screenPadding, gap: 2 },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3 },
  dayCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  dayCircleSelected: { backgroundColor: Colors.brandOrange },
  dayText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  dayTextToday: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold },
  dayTextSelected: { color: Colors.background, fontFamily: FontFamily.bodySemiBold },
  dot: { width: 6, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: Colors.inkPrimary },
  dotSelected: { backgroundColor: Colors.background },
})

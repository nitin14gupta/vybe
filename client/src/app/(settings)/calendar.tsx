import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import {
  ChevronLeft, ChevronRight, Search,
  CalendarHeart, Ticket as TicketIcon,
} from 'lucide-react-native'
import {
  AppHeader, HeaderIconBtn, CreateEventSheet,
  PrimaryButton, OutlineButton,
} from '@/components/ui'
import { EventSearchModal } from '@/components/events/EventSearchModal'
import { DayEventRow, DayEventRowSkeleton } from '@/components/calendar/DayEventRow'
import { useCalendarEvents, dateKey } from '@/hooks/useCalendarEvents'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { hTap } from '@/lib/haptics'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}
function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

export default function CalendarScreen() {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const { eventsByDay, loading } = useCalendarEvents()

  const gridWeeks = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstWeekday).fill(null)
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
    while (cells.length % 7 !== 0) cells.push(null)
    const weeks: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
  }, [visibleMonth])

  const goToday = () => {
    hTap()
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }
  const shiftMonth = (delta: number) => {
    hTap()
    setVisibleMonth(v => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  }
  const selectDate = (d: Date) => { hTap(); setSelectedDate(d) }
  const shiftDay = (delta: number) => {
    hTap()
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + delta)
    setSelectedDate(next)
    if (next.getMonth() !== visibleMonth.getMonth() || next.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    }
  }

  const selKey = dateKey(selectedDate)
  const dayData = eventsByDay.get(selKey)
  const dayJoined = dayData?.joined ?? []
  const dayHosted = dayData?.hosted ?? []
  const hasEvents = dayJoined.length > 0 || dayHosted.length > 0
  const isPast = selectedDate.getTime() < today.getTime()

  return (
    <View style={s.root}>
      <AppHeader
        title="Calendar"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ChevronLeft size={20} color={Colors.inkPrimary} strokeWidth={2.2} /></HeaderIconBtn>}
        rightAction={<HeaderIconBtn onPress={() => { hTap(); setSearchOpen(true) }}><Search size={19} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <View style={s.monthRow}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={s.monthArrow}>
          <ChevronLeft size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
        <Text style={s.monthTitle}>{MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={s.monthArrow}>
          <ChevronRight size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={goToday} style={s.todayBtn}>
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
              const hasDot = eventsByDay.has(k)
              const isSelected = k === selKey
              const isToday = k === dateKey(today)
              return (
                <Pressable key={di} style={s.dayCell} onPress={() => selectDate(d)}>
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

      <View style={s.panel}>
        <View style={s.dayNavRow}>
          <Pressable onPress={() => shiftDay(-1)} hitSlop={10} style={s.dayNavArrow}>
            <ChevronLeft size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={s.dayNavText} numberOfLines={1}>
            <Text style={s.dayNavBold}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })} </Text>
            <Text style={s.dayNavMuted}>{MONTH_NAMES[selectedDate.getMonth()]} {ordinal(selectedDate.getDate())}</Text>
          </Text>
          <Pressable onPress={() => shiftDay(1)} hitSlop={10} style={s.dayNavArrow}>
            <ChevronRight size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>

        {loading ? (
          <View style={s.eventsScroll}>
            <View style={s.cardsCol}>
              {Array.from({ length: 3 }).map((_, i) => <DayEventRowSkeleton key={i} />)}
            </View>
          </View>
        ) : hasEvents ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.eventsScroll}>
            {dayJoined.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>GOING</Text>
                <View style={s.cardsCol}>
                  {dayJoined.map(e => <DayEventRow key={e.id} event={e} />)}
                </View>
              </View>
            )}
            {dayHosted.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>HOSTING</Text>
                <View style={s.cardsCol}>
                  {dayHosted.map(e => <DayEventRow key={e.id} event={e} />)}
                </View>
              </View>
            )}
          </ScrollView>
        ) : isPast ? (
          <View style={s.emptyWrap}>
            <TicketIcon size={30} color={Colors.inkDisabled} strokeWidth={1.4} />
            <Text style={s.emptyPastText}>Nothing on this day</Text>
          </View>
        ) : (
          <View style={s.emptyWrap}>
            <View style={s.emptyIconWrap}>
              <CalendarHeart size={28} color={Colors.brandOrange} strokeWidth={1.6} />
            </View>
            <Text style={s.emptyTitle}>Got plans?</Text>
            <Text style={s.emptySub}>It seems not. Let's change that.</Text>
            <View style={s.emptyActions}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Create Event" size="small" onPress={() => { hTap(); setCreateOpen(true) }} />
              </View>
              <View style={{ flex: 1 }}>
                <OutlineButton label="Browse Events" size="small" onPress={() => { hTap(); router.push('/(tabs)/events' as any) }} />
              </View>
            </View>
          </View>
        )}
      </View>

      <EventSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} nearbyEvents={[]} />
      <CreateEventSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateEvent={() => router.push('/(events)/create' as any)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

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
  dayTextSelected: { color: '#111', fontFamily: FontFamily.bodySemiBold },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: Colors.brandOrange },
  dotSelected: { backgroundColor: '#111' },

  panel: {
    flex: 1, marginTop: 14,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.modal, borderTopRightRadius: Radius.modal,
    paddingTop: 14,
  },
  dayNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: Spacing.screenPadding, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  dayNavArrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dayNavText: { flex: 1, textAlign: 'center' },
  dayNavBold: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  dayNavMuted: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkSecondary },

  eventsScroll: { padding: Spacing.screenPadding, gap: 20 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.8,
    color: Colors.inkSecondary,
  },
  cardsCol: { gap: 10 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 6 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 18 },
  emptyActions: { flexDirection: 'row', gap: 10, width: '100%' },
  emptyPastText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled, marginTop: 4 },
})

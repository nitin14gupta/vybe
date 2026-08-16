import { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { ArrowLeft, ListFilter } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, CreateEventSheet } from '@/components/ui'
// import { EventSearchModal } from '@/components/events/EventSearchModal'
import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid'
import { CalendarDayPanel } from '@/components/calendar/CalendarDayPanel'
import { CalendarFilterSheet } from '@/components/calendar/CalendarFilterSheet'
import { FilterUpdatedToast } from '@/components/calendar/FilterUpdatedToast'
import { useCalendarEvents, dateKey, DEFAULT_CALENDAR_FILTERS, type CalendarFilters } from '@/hooks/useCalendarEvents'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}
const CALENDAR_FILTERS_KEY = 'calendar_filters'

export default function CalendarScreen() {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  // const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS)
  const [toastVisible, setToastVisible] = useState(false)

  const { hasEventsOnDate, dayEvents, dayLoading, dayError, reloadDay } = useCalendarEvents(visibleMonth, selectedDate, filters)

  // Cache the last-applied filters so they persist across visits — a plain
  // read-once-on-mount + write-on-apply, no need for anything fancier.
  useEffect(() => {
    AsyncStorage.getItem(CALENDAR_FILTERS_KEY).then(raw => {
      if (!raw) return
      try {
        setFilters({ ...DEFAULT_CALENDAR_FILTERS, ...JSON.parse(raw) })
      } catch {}
    })
  }, [])

  const applyFilters = (next: CalendarFilters) => {
    setFilters(next)
    setToastVisible(true)
    AsyncStorage.setItem(CALENDAR_FILTERS_KEY, JSON.stringify(next)).catch(() => {})
  }

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
    setVisibleMonth(v => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  }
  const selectDate = (d: Date) => { hTap(); setSelectedDate(d) }
  const shiftDay = (delta: number) => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + delta)
    setSelectedDate(next)
    if (next.getMonth() !== visibleMonth.getMonth() || next.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    }
  }

  const activeFilterCount =
    (filters.showHosted ? 0 : 1) + (filters.showGoing ? 0 : 1) + (filters.showWaitlisted ? 0 : 1) + (filters.city ? 1 : 0)

  return (
    <View style={s.root}>
      <AppHeader
        title="Calendar"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
        rightAction={
          <>
            <HeaderIconBtn onPress={() => { hTap(); setFilterOpen(true) }}>
              <View>
                <ListFilter size={18} color={Colors.inkPrimary} strokeWidth={2} />
                {activeFilterCount > 0 && (
                  <View style={s.filterBadge}>
                    <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
            </HeaderIconBtn>
            {/* <HeaderIconBtn onPress={() => { hTap(); setSearchOpen(true) }}><Search size={19} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn> */}
          </>
        }
      />

      <FilterUpdatedToast
        visible={toastVisible}
        onView={() => setToastVisible(false)}
        onDismiss={() => setToastVisible(false)}
      />

      <CalendarMonthGrid
        visibleMonth={visibleMonth}
        today={today}
        selectedKey={dateKey(selectedDate)}
        gridWeeks={gridWeeks}
        hasEventsOnDate={hasEventsOnDate}
        onShiftMonth={shiftMonth}
        onGoToday={goToday}
        onSelectDate={selectDate}
      />

      <CalendarDayPanel
        selectedDate={selectedDate}
        dayLoading={dayLoading}
        dayError={dayError}
        dayEvents={dayEvents}
        onShiftDay={shiftDay}
        onRetry={reloadDay}
        onCreateEvent={() => { setCreateOpen(true) }}
        onBrowseEvents={() => router.push('/(tabs)/events' as any)}
      />

      {/* <EventSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} nearbyEvents={[]} /> */}
      <CreateEventSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateEvent={() => router.push('/(events)/create' as any)}
      />
      <CalendarFilterSheet
        visible={filterOpen}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.white },
})

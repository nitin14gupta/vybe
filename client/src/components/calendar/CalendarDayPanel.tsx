import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { ChevronLeft, ChevronRight, CalendarHeart, TriangleAlert } from 'lucide-react-native'
import { PrimaryButton, OutlineButton, EventListCard, EventListCardSkeleton } from '@/components/ui'
import type { DayEvents } from '@/hooks/useCalendarEvents'
import { Colors, FontFamily, Spacing, Radius, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

interface CalendarDayPanelProps {
  selectedDate: Date
  dayLoading: boolean
  dayError: boolean
  dayEvents: DayEvents
  onShiftDay: (delta: number) => void
  onRetry: () => void
  onCreateEvent: () => void
  onBrowseEvents: () => void
}

export function CalendarDayPanel({
  selectedDate, dayLoading, dayError, dayEvents,
  onShiftDay, onRetry, onCreateEvent, onBrowseEvents,
}: CalendarDayPanelProps) {
  const { joined: dayJoined, hosted: dayHosted, waitlisted: dayWaitlisted, other: dayOther } = dayEvents
  const hasEvents = dayJoined.length > 0 || dayHosted.length > 0 || dayWaitlisted.length > 0 || dayOther.length > 0

  return (
    <View style={s.panel}>
      <View style={s.dayNavRow}>
        <Pressable onPress={() => { hTap(); onShiftDay(-1) }} hitSlop={10} style={s.dayNavArrow}>
          <ChevronLeft size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
        <Text style={s.dayNavText} numberOfLines={1}>
          <Text style={s.dayNavBold}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })} </Text>
          <Text style={s.dayNavMuted}>{MONTH_NAMES[selectedDate.getMonth()]} {ordinal(selectedDate.getDate())}</Text>
        </Text>
        <Pressable onPress={() => { hTap(); onShiftDay(1) }} hitSlop={10} style={s.dayNavArrow}>
          <ChevronRight size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
      </View>

      {dayLoading ? (
        <View style={s.eventsScroll}>
          <View style={s.cardsCol}>
            {Array.from({ length: 3 }).map((_, i) => <EventListCardSkeleton key={i} />)}
          </View>
        </View>
      ) : dayError ? (
        <View style={s.emptyWrap}>
          <TriangleAlert size={28} color={Colors.inkDisabled} strokeWidth={1.6} />
          <Text style={s.emptyTitle}>Couldn't load this day</Text>
          <Text style={s.emptySub}>Check your connection and try again</Text>
          <PrimaryButton label="Retry" size="small" onPress={() => { hTap(); onRetry() }} />
        </View>
      ) : hasEvents ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.eventsScroll}>
          {dayJoined.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>GOING</Text>
              <View style={s.cardsCol}>
                {dayJoined.map(e => <EventListCard key={e.id} event={e} />)}
              </View>
            </View>
          )}
          {dayHosted.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>HOSTING</Text>
              <View style={s.cardsCol}>
                {dayHosted.map(e => <EventListCard key={e.id} event={e} />)}
              </View>
            </View>
          )}
          {dayWaitlisted.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>WAITLISTED</Text>
              <View style={s.cardsCol}>
                {dayWaitlisted.map(e => <EventListCard key={e.id} event={e} />)}
              </View>
            </View>
          )}
          {dayOther.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>HAPPENING NEARBY</Text>
              <View style={s.cardsCol}>
                {dayOther.map(e => <EventListCard key={e.id} event={e} />)}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <CalendarHeart size={28} color={Colors.brandOrange} strokeWidth={1.6} />
          </View>
          <Text style={s.emptyTitle}>Got plans?</Text>
          <Text style={s.emptySub}>It seems not. Let's change that.</Text>
          <View style={s.emptyActions}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Create Event" size="small" onPress={() => { hTap(); onCreateEvent() }} />
            </View>
            <View style={{ flex: 1 }}>
              <OutlineButton label="Browse Events" size="small" onPress={() => { hTap(); onBrowseEvents() }} />
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
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
    backgroundColor: withOpacity(Colors.brandOrange, 0.12),
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 18 },
  emptyActions: { flexDirection: 'row', gap: 10, width: '100%' },
})

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { QrCode, ChevronRight } from 'lucide-react-native'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { parseServerDate } from '@/lib/dates'
import { Colors, FontFamily } from '@/constants'

const CARD_WIDTH = 240

export function relativeDayLabel(date: Date): string {
  const now = new Date()
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventMid = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((eventMid.getTime() - todayMid.getTime()) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `This ${date.toLocaleDateString('en-US', { weekday: 'long' })}`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Every event you're actually going to (RSVP'd/ticketed, not yet ended) —
// a "you're going" reminder, separate from RecentlyViewedSection which just
// tracks what you've looked at. Nobody has more than a handful of these at
// once, so fetching them all and scrolling horizontally needs no paging.
// Presentational only — MyEventsSection fetches and orders it against
// HostingSection by whichever has the nearer date.
export function UpNextSection({ events }: { events: EventSummary[] }) {
  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <Text style={s.title}>You're Going</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list}>
        {events.map(e => {
          const d = parseServerDate(e.date_time)
          return (
            <View key={e.id} style={s.card}>
              <EventCard
                event={e}
                showHost
                onPress={() => router.push(`/(events)/${e.id}` as any)}
                footer={
                  <Pressable
                    style={s.ticketFooter}
                    onPress={() => router.push(`/(events)/${e.id}/ticket` as any)}
                  >
                    <QrCode size={15} color={Colors.brandOrange} strokeWidth={2} />
                    <Text style={s.ticketFooterText}>
                      {d ? relativeDayLabel(d) : ''} · View Ticket
                    </Text>
                    <ChevronRight size={15} color={Colors.brandOrange} strokeWidth={2} />
                  </Pressable>
                }
              />
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  list: { gap: 12, paddingRight: 4 },
  card: { width: CARD_WIDTH },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.2)',
    paddingVertical: 12,
  },
  ticketFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },
})

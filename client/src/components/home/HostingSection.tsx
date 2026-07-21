import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Users, ChevronRight } from 'lucide-react-native'
import type { EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { parseServerDate } from '@/lib/dates'
import { relativeDayLabel } from './UpNextSection'
import { Colors, FontFamily } from '@/constants'

const CARD_WIDTH = 240

// Every upcoming event you're hosting — mirrors UpNextSection but for the
// host side. Presentational only — MyEventsSection fetches and orders it
// against UpNextSection by whichever has the nearer date.
export function HostingSection({ events }: { events: EventSummary[] }) {
  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <Text style={s.title}>You're Hosting</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list}>
        {events.map(e => {
          const d = parseServerDate(e.date_time)
          return (
            <View key={e.id} style={s.card}>
              <EventCard
                event={e}
                onPress={() => router.push(`/(events)/${e.id}` as any)}
                footer={
                  <Pressable
                    style={s.manageFooter}
                    onPress={() => router.push(`/(events)/${e.id}/attendees` as any)}
                  >
                    <Users size={15} color={Colors.brandOrange} strokeWidth={2} />
                    <Text style={s.manageFooterText}>
                      {d ? relativeDayLabel(d) : ''} · Manage
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
  manageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.2)',
    paddingVertical: 12,
  },
  manageFooterText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },
})

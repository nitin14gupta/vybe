import { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import { EventListCard } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'

export function RecentlyViewedSection() {
  const events = useRecentEventsStore(s => s.events)
  const pruneEnded = useRecentEventsStore(s => s.pruneEnded)

  useFocusEffect(useCallback(() => { pruneEnded() }, [pruneEnded]))

  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Recently Viewed</Text>
      <View style={s.list}>
        {events.map(e => <EventListCard key={e.id} event={e} />)}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  list: { gap: 10 },
})

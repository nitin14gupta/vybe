import { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import { EventListCard } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export function RecentlyViewedSection({ onEmptyChange }: Props) {
  const events = useRecentEventsStore(s => s.events)
  const pruneEnded = useRecentEventsStore(s => s.pruneEnded)

  useFocusEffect(useCallback(() => { pruneEnded() }, [pruneEnded]))

  useEffect(() => { onEmptyChange?.(events.length === 0) }, [events.length])

  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Recently Viewed</Text>
      <View style={s.list}>
        {events.map(e => <EventListCard key={e.id} event={e} showHotlist={false} />)}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  list: { gap: 10 },
})

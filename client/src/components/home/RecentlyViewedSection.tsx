import { useCallback, useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import { EventListCard, ShimmerText } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const COLLAPSED_COUNT = 3

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export function RecentlyViewedSection({ onEmptyChange }: Props) {
  const events = useRecentEventsStore(s => s.events)
  const pruneEnded = useRecentEventsStore(s => s.pruneEnded)
  const [expanded, setExpanded] = useState(false)

  useFocusEffect(useCallback(() => { pruneEnded() }, [pruneEnded]))

  useEffect(() => { onEmptyChange?.(events.length === 0) }, [events.length])

  if (events.length === 0) return null

  const hasMore = events.length > COLLAPSED_COUNT
  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT)

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <ShimmerText style={s.title}>Recently Viewed</ShimmerText>
        {hasMore && (
          <Pressable onPress={() => { hTap(); setExpanded(v => !v) }} hitSlop={8}>
            <ShimmerText style={s.seeAll}>{expanded ? 'Show less' : 'See all'}</ShimmerText>
          </Pressable>
        )}
      </View>
      <View style={s.list}>
        {visible.map(e => <EventListCard key={e.id} event={e} showHotlist={false} />)}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  seeAll: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkPrimary },
  list: { gap: 10 },
})

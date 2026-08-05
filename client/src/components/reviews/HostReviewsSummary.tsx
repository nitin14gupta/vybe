import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'
import { StarRow, RatingDistribution, RatingFilterRow } from './ReviewParts'
import { EventPerformanceSection } from './HostAnalytics'
import type { HostReviewEvent } from '@/api/apiService'

export function HostReviewsSummary({
  avgRating,
  count,
  distribution,
  events,
  isOwnProfile,
  activeEventId,
  activeRating,
  onSelectEvent,
  onSelectRating,
  onOpenEventSheet,
}: {
  avgRating: number | null
  count: number
  distribution: Record<string, number>
  events: HostReviewEvent[]
  isOwnProfile: boolean
  activeEventId: string | null
  activeRating: number | null
  onSelectEvent: (id: string | null) => void
  onSelectRating: (rating: number | null) => void
  onOpenEventSheet: () => void
}) {
  const activeEventTitle = activeEventId ? events.find(e => e.id === activeEventId)?.title : null

  return (
    <View>
      <View style={s.summary}>
        <View style={s.summaryTop}>
          <View style={s.summaryLeft}>
            <Text style={s.avg}>{avgRating?.toFixed(1) ?? '—'}</Text>
            <StarRow rating={Math.round(avgRating ?? 0)} />
            <Text style={s.countText}>{count} {count === 1 ? 'review' : 'reviews'}</Text>
          </View>
          <RatingDistribution distribution={distribution} total={count} />
        </View>
      </View>

      {isOwnProfile && (
        <EventPerformanceSection events={events} activeEventId={activeEventId} onSelect={onSelectEvent} />
      )}

      {isOwnProfile && events.length > 1 && (
        <Pressable style={s.eventFilterBtn} onPress={onOpenEventSheet}>
          <Text style={s.eventFilterLabel} numberOfLines={1}>
            {activeEventTitle ?? 'All events'}
          </Text>
          <ChevronDown size={16} color={Colors.inkSecondary} strokeWidth={2} />
        </Pressable>
      )}

      <RatingFilterRow activeRating={activeRating} onSelect={onSelectRating} distribution={distribution} />

      <Text style={s.whatPeopleSay}>What people say</Text>
    </View>
  )
}

const s = StyleSheet.create({
  summary: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  summaryLeft: {
    alignItems: 'flex-start',
    gap: 4,
  },
  avg: {
    fontFamily: FontFamily.headingBold,
    fontSize: 44,
    color: Colors.inkPrimary,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  countText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  whatPeopleSay: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    paddingHorizontal: Spacing.screenPadding,
    marginTop: 4,
    marginBottom: 16,
  },
  eventFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.card,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  eventFilterLabel: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
})

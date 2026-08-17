import React, { useCallback, useMemo, useState } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react-native'
import { Colors, FontFamily, Radius, Spacing, withOpacity } from '@/constants'
import type { HostReviewEvent } from '@/api/apiService'

const LOW_THRESHOLD = 3.5
const HIGH_THRESHOLD = 4.5
const BAR_WIDTH = 24
const BAR_SPACING = 22
const CHART_HEIGHT = 160
const DEFAULT_VISIBLE = 6

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_WIDTH = SCREEN_WIDTH - Spacing.screenPadding * 2 - 32 // minus card padding

function ratingColor(rating: number | null): string {
  if (rating == null) return Colors.inkDisabled
  if (rating < LOW_THRESHOLD) return Colors.brandCoral
  if (rating >= HIGH_THRESHOLD) return Colors.accentGreen
  return Colors.brandOrange
}

function formatEventType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function shortLabel(label: string): string {
  const first = label.split(' ')[0]
  return first.length > 10 ? `${first.slice(0, 9)}…` : first
}

type ChartRow = { id: string; label: string; value: number | null; count: number }

function RatingBarChart({
  rows,
  onSelect,
}: {
  rows: ChartRow[]
  onSelect?: (id: string) => void
}) {
  const data = useMemo(
    () =>
      rows.map(row => {
        const color = ratingColor(row.value)
        return {
          value: row.value ?? 0,
          label: shortLabel(row.label),
          frontColor: color,
          onPress: onSelect ? () => onSelect(row.id) : undefined,
          topLabelComponent: () => (
            <Text style={[a.barValue, { color }]}>{row.value != null ? row.value.toFixed(1) : '—'}</Text>
          ),
        }
      }),
    [rows, onSelect],
  )

  const contentWidth = rows.length * (BAR_WIDTH + BAR_SPACING) + 30
  const width = Math.max(contentWidth, CARD_WIDTH)

  return (
    <View style={a.card}>
      <BarChart
        data={data}
        width={width}
        height={CHART_HEIGHT}
        barWidth={BAR_WIDTH}
        spacing={BAR_SPACING}
        initialSpacing={20}
        endSpacing={10}
        barBorderRadius={6}
        roundedTop
        maxValue={5}
        noOfSections={5}
        xAxisThickness={0}
        yAxisThickness={0}
        rulesType="dashed"
        dashWidth={4}
        dashGap={5}
        rulesColor={withOpacity(Colors.inkPrimary, 0.1)}
        yAxisTextStyle={a.axisLabel}
        xAxisLabelTextStyle={a.axisLabel}
        yAxisLabelWidth={20}
        isAnimated
        animationDuration={600}
        disablePress={!onSelect}
        disableScroll={false}
        nestedScrollEnabled
        showScrollIndicator
        indicatorColor="white"
        bounces={false}
      />
    </View>
  )
}

export function EventPerformanceSection({
  events,
  activeEventId,
  onSelect,
}: {
  events: HostReviewEvent[]
  activeEventId: string | null
  onSelect: (id: string | null) => void
}) {
  const lowCount = useMemo(
    () => events.filter(e => e.avg_rating != null && e.avg_rating < LOW_THRESHOLD).length,
    [events],
  )
  const [expanded, setExpanded] = useState(false)
  const allRows: ChartRow[] = useMemo(
    () => events.map(ev => ({ id: ev.id, label: ev.title, value: ev.avg_rating, count: ev.review_count })),
    [events],
  )
  const rows = useMemo(
    () => (expanded ? allRows : allRows.slice(0, DEFAULT_VISIBLE)),
    [expanded, allRows],
  )
  const handleSelect = useCallback(
    (id: string) => onSelect(activeEventId === id ? null : id),
    [activeEventId, onSelect],
  )

  if (events.length < 2) return null

  const canExpand = allRows.length > DEFAULT_VISIBLE

  return (
    <View style={a.section}>
      <Text style={a.sectionTitle}>Event Performance</Text>
      {/* {lowCount > 0 && (
        <View style={a.warningRow}>
          <AlertTriangle size={14} color={Colors.brandCoral} strokeWidth={2} />
          <Text style={a.warningText}>
            {lowCount} event{lowCount === 1 ? '' : 's'} rated below {LOW_THRESHOLD} — worth a look
          </Text>
        </View>
      )} */}
      <RatingBarChart rows={rows} onSelect={handleSelect} />
      {canExpand && (
        <Pressable style={a.expandBtn} onPress={() => setExpanded(v => !v)}>
          <Text style={a.expandText}>
            {expanded ? 'Show fewer' : `Show all ${allRows.length} events`}
          </Text>
          {expanded ? (
            <ChevronUp size={14} color={Colors.brandOrange} strokeWidth={2} />
          ) : (
            <ChevronDown size={14} color={Colors.brandOrange} strokeWidth={2} />
          )}
        </Pressable>
      )}
    </View>
  )
}

export function EventTypeSection({ events }: { events: HostReviewEvent[] }) {
  const byType = useMemo(() => {
    const groups: Record<string, { totalWeighted: number; count: number }> = {}
    for (const ev of events) {
      if (ev.avg_rating == null) continue
      const g = groups[ev.event_type] ?? { totalWeighted: 0, count: 0 }
      g.totalWeighted += ev.avg_rating * ev.review_count
      g.count += ev.review_count
      groups[ev.event_type] = g
    }
    return Object.entries(groups)
      .map(([type, g]) => ({ type, avg: g.totalWeighted / g.count, count: g.count }))
      .sort((x, y) => x.avg - y.avg)
  }, [events])
  const rows: ChartRow[] = useMemo(
    () => byType.map(t => ({ id: t.type, label: formatEventType(t.type), value: t.avg, count: t.count })),
    [byType],
  )

  if (byType.length < 2) return null

  return (
    <View style={a.section}>
      <Text style={a.sectionTitle}>Rating by Event Type</Text>
      <RatingBarChart rows={rows} />
    </View>
  )
}

const a = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: withOpacity(Colors.brandCoral, 0.1),
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.brandCoral,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingVertical: 20,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  axisLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.inkSecondary,
  },
  barValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    marginBottom: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  expandText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.brandOrange,
  },
})

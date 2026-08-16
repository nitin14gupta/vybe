import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Calendar, ChevronRight, Clock, MapPin, Shield, Users } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { Colors, EVENT_ICONS, EVENT_ICON_FALLBACK, FontFamily, withOpacity } from '@/constants'
import { hTap, hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { daysUntil, formatDateTime } from './eventDetailUtils'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  onPressAddress: () => void
}

export function EventInfoHeader({ event, onPressAddress }: Props) {
  const showPill = usePillStore(s => s.show)

  return (
    <>
      <View style={styles.categoryRow}>
        <View style={styles.categoryChip}>
          {(() => {
            const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
            return <TypeIcon size={12} color={Colors.brandOrange} strokeWidth={2} />
          })()}
          <Text style={styles.categoryChipText}>{event.event_type.replace('_', ' ')}</Text>
        </View>
        {event.age_restriction && (
          <View style={styles.ageBadge}>
            <Shield size={12} color={Colors.inkSecondary} />
            <Text style={styles.ageBadgeText}>{event.age_restriction}+</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.daysAway}>{daysUntil(event.date_time)}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Calendar size={16} color={Colors.brandOrange} />
          <Text style={styles.infoText}>{formatDateTime(event.date_time)}</Text>
        </View>
        {event.end_time && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Clock size={16} color={Colors.inkSecondary} />
              <Text style={styles.infoText}>Ends {formatDateTime(event.end_time)}</Text>
            </View>
          </>
        )}
        {event.location_name && (
          <>
            <View style={styles.infoDivider} />
            <Pressable
              style={styles.infoRow}
              onPress={() => { hTap(); onPressAddress() }}
              onLongPress={() => {
                hSuccess()
                Clipboard.setStringAsync(event.location_name ?? '')
                showPill('Address copied', 'default')
              }}
            >
              <MapPin size={16} color={Colors.brandOrange} />
              <Text style={styles.infoText}>{event.location_name}</Text>
              <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
            </Pressable>
          </>
        )}
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Users size={16} color={Colors.inkSecondary} />
          <Text style={styles.infoText}>
            {event.attendee_count} going · {event.spots_left} spots left
          </Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: withOpacity(Colors.brandOrange, 0.15),
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  ageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ageBadgeText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyMedium, fontSize: 12 },

  title: { fontFamily: FontFamily.headingBold, fontSize: 28, color: Colors.inkPrimary, lineHeight: 34, marginBottom: 4 },
  daysAway: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandOrange, marginBottom: 20 },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkPrimary, lineHeight: 20 },
  infoDivider: { height: 1, backgroundColor: Colors.divider },
})

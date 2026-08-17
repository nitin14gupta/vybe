import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Clock, Shield } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { parseDate } from './eventDetailUtils'
import type { EventDetail } from '@/api/apiService'

interface Props {
  reason: 'checkin' | 'edit' | 'cancel' | 'age'
  event: EventDetail
  onBack: () => void
}

export function EventLockedScreen({ reason, event, onBack }: Props) {
  const insets = useSafeAreaInsets()
  const eventStart = parseDate(event.date_time)

  let title: string
  let subtitle: string
  let icon: React.ReactNode

  if (reason === 'checkin') {
    const opensAt = eventStart
      ? new Date(eventStart.getTime() - 3 * 3600_000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })
      : '3 hours before the event'
    title = 'Check-in not open yet'
    subtitle = `Scanner unlocks 3 hours before the event starts.\n\nComes alive at ${opensAt}.`
    icon = <Clock size={40} color={Colors.inkPrimary} strokeWidth={1.5} />
  } else if (reason === 'edit') {
    title = 'Editing is closed'
    subtitle = 'Events can only be edited up to 7 hours before they start.\n\nThis window has passed for this event.'
    icon = <Clock size={40} color={Colors.inkPrimary} strokeWidth={1.5} />
  } else if (reason === 'cancel') {
    title = 'Cancellation is closed'
    subtitle = 'Events can only be cancelled at least 48 hours in advance.\n\nThis window has passed for this event.'
    icon = <Clock size={40} color={Colors.inkPrimary} strokeWidth={1.5} />
  } else {
    title = `${event.age_restriction}+ Only`
    subtitle = `This event has an age restriction of ${event.age_restriction}+.\n\nYou must be ${event.age_restriction} or older to attend.`
    icon = <Shield size={40} color={Colors.destructive} strokeWidth={1.5} />
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingHorizontal: 24 }]}>
      <Pressable style={styles.lockedBack} onPress={onBack}>
        <ArrowLeft size={20} color={Colors.inkSecondary} />
        <Text style={styles.lockedBackText}>Back to Event</Text>
      </Pressable>
      <View style={styles.lockedBody}>
        <View style={[styles.lockedIconWrap, reason === 'age' && { backgroundColor: withOpacity(Colors.destructive, 0.12) }]}>
          {icon}
        </View>
        <Text style={styles.lockedTitle}>{title}</Text>
        <Text style={styles.lockedSubtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  lockedBack: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  lockedBackText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
  lockedBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  lockedIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Colors.inkPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 14,
  },
  lockedSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
})

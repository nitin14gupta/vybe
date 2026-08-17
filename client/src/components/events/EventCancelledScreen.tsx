import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, X as XIcon } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  isHost: boolean
  onBack: () => void
}

export function EventCancelledScreen({ event, isHost, onBack }: Props) {
  const insets = useSafeAreaInsets()
  const subtitle = isHost
    ? 'You cancelled this event. Attendees have been notified, and anyone who paid has been refunded to their Gorave Wallet.'
    : event.is_free
      ? 'The host cancelled this event. It is no longer happening.'
      : 'The host cancelled this event. Your payment has been refunded to your Gorave Wallet.'

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingHorizontal: 24 }]}>
      <Pressable style={styles.lockedBack} onPress={onBack}>
        <ArrowLeft size={20} color={Colors.inkSecondary} />
        <Text style={styles.lockedBackText}>Back</Text>
      </Pressable>
      <View style={styles.lockedBody}>
        <View style={[styles.lockedIconWrap, { backgroundColor: withOpacity(Colors.destructive, 0.12) }]}>
          <XIcon size={40} color={Colors.destructive} strokeWidth={2} />
        </View>
        <Text style={styles.lockedTitle}>Event Cancelled</Text>
        <Text style={styles.deletedBody} numberOfLines={1}>{event.title}</Text>
        <Text style={[styles.lockedSubtitle, { marginTop: 14 }]}>{subtitle}</Text>
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
    backgroundColor: withOpacity(Colors.destructive, 0.12),
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
  deletedBody: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})

import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

export function LockedBanner({ capacityLocked }: { capacityLocked: boolean }) {
  return (
    <View style={s.lockedBanner}>
      <Text style={s.lockedText}>
        {capacityLocked
          ? 'Editing closed — event starts in under 2 hours'
          : 'Event is locked for editing. You can still increase capacity to let in waitlisted guests.'}
      </Text>
    </View>
  )
}

export function DateShiftBanner({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <View style={s.dateShiftBanner}>
      <Text style={s.dateShiftTitle}>Large date change</Text>
      <Text style={s.dateShiftBody}>
        You moved this event by more than 7 days. All attendees will be notified and given 48 hours to cancel for a full refund.
      </Text>
      <View style={s.dateShiftBtns}>
        <Pressable style={s.dateShiftCancel} onPress={onCancel}>
          <Text style={s.dateShiftCancelText}>Go back</Text>
        </Pressable>
        <Pressable style={s.dateShiftConfirm} onPress={onConfirm}>
          <Text style={s.dateShiftConfirmText}>Yes, update</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  lockedBanner: {
    backgroundColor: withOpacity(Colors.brandCoral, 0.12),
    borderBottomWidth: 1, borderBottomColor: Colors.brandCoral,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  lockedText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandCoral, textAlign: 'center' },

  dateShiftBanner: {
    backgroundColor: withOpacity(Colors.accentGold, 0.08),
    borderBottomWidth: 1, borderBottomColor: withOpacity(Colors.accentGold, 0.3),
    paddingVertical: 14, paddingHorizontal: 20, gap: 8,
  },
  dateShiftTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.accentGold },
  dateShiftBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  dateShiftBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dateShiftCancel: {
    flex: 1, height: 38, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  dateShiftCancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  dateShiftConfirm: {
    flex: 1, height: 38, borderRadius: 20,
    backgroundColor: Colors.accentGold,
    alignItems: 'center', justifyContent: 'center',
  },
  dateShiftConfirmText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.background },
})

import { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Check } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing } from '@/constants'
import { ContactAvatar } from './ContactAvatar'
import type { DeviceContact } from '@/hooks/useDeviceContacts'

export const DeviceContactRow = memo(function DeviceContactRow({
  contact,
  selected,
  added,
  onPress,
}: {
  contact: DeviceContact
  selected: boolean
  added?: boolean
  onPress: (contact: DeviceContact) => void
}) {
  return (
    <Pressable
      style={[s.row, added && s.rowAdded]}
      disabled={added}
      onPress={() => { hTap(); onPress(contact) }}
    >
      <ContactAvatar name={contact.name} size={40} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{contact.name}</Text>
        <Text style={s.phone} numberOfLines={1}>{contact.phone}</Text>
      </View>
      {added ? (
        <Text style={s.addedLabel}>Added</Text>
      ) : selected ? (
        <View style={s.check}>
          <Check size={14} color={Colors.background} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 10, gap: 14,
  },
  rowAdded: { opacity: 0.45 },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  phone: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  addedLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
  check: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
})

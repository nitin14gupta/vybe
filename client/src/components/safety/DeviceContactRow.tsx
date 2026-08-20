import { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing } from '@/constants'
import { ContactAvatar } from './ContactAvatar'
import type { DeviceContact } from '@/hooks/useDeviceContacts'

export const DeviceContactRow = memo(function DeviceContactRow({
  contact,
  onPress,
}: {
  contact: DeviceContact
  onPress: (contact: DeviceContact) => void
}) {
  return (
    <Pressable style={s.row} onPress={() => { hTap(); onPress(contact) }}>
      <ContactAvatar name={contact.name} size={40} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{contact.name}</Text>
        <Text style={s.phone} numberOfLines={1}>{contact.phone}</Text>
      </View>
    </Pressable>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 10, gap: 14,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  phone: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
})

import { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { hError } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'
import { ContactAvatar } from './ContactAvatar'
import type { EmergencyContact } from '@/types/api'

export const EmergencyContactRow = memo(function EmergencyContactRow({
  contact,
  onDelete,
}: {
  contact: EmergencyContact
  onDelete: (contact: EmergencyContact) => void
}) {
  return (
    <View style={s.row}>
      <ContactAvatar name={contact.name} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{contact.name}</Text>
        <Text style={s.phone} numberOfLines={1}>{contact.phone}</Text>
      </View>
      <Pressable
        style={s.deleteBtn}
        hitSlop={8}
        onPress={() => { hError(); onDelete(contact) }}
      >
        <Trash2 size={16} color={Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 12, gap: 14,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  phone: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    alignItems: 'center', justifyContent: 'center',
  },
})

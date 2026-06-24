import { View, Text, Pressable, StyleSheet } from 'react-native'
import { X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'

interface Props {
  msg: Message
  myId: string
  partnerName: string | null
  onCancel: () => void
}

export function ReplyBar({ msg, myId, partnerName, onCancel }: Props) {
  const isOwn = msg.sender_id === myId
  const senderLabel = isOwn ? 'You' : (partnerName ?? 'Them')

  const preview =
    msg.content_type === 'voice' ? '🎤 Voice message' :
    msg.content_type === 'event' ? '📅 Event' :
    msg.content_type === 'profile' ? '👤 Profile' :
    (msg.content ?? '')

  return (
    <View style={s.wrap}>
      <View style={s.accent} />
      <View style={s.body}>
        <Text style={s.sender}>{senderLabel}</Text>
        <Text style={s.preview} numberOfLines={1}>{preview}</Text>
      </View>
      <Pressable onPress={onCancel} style={s.cancel} hitSlop={8}>
        <X size={16} color={Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  accent: { width: 3, height: 32, borderRadius: 2, backgroundColor: Colors.brandOrange },
  body: { flex: 1, gap: 2 },
  sender: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.brandOrange },
  preview: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  cancel: { padding: 4 },
})

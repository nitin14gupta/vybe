import { View, Text, Pressable, StyleSheet } from 'react-native'
import { X, Mic, Image, Film, Calendar, User } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'

interface Props {
  msg: Message
  myId: string
  partnerName: string | null
  onCancel: () => void
}

type PreviewConfig = { icon: React.ReactNode; label: string }

function getPreview(msg: Message): PreviewConfig | null {
  const ic = (Icon: any) => <Icon size={12} color={Colors.inkSecondary} strokeWidth={2} />
  switch (msg.content_type) {
    case 'voice':   return { icon: ic(Mic),      label: 'Voice message' }
    case 'image':   return { icon: ic(Image),    label: 'Photo' }
    case 'gif':     return { icon: ic(Film),     label: 'GIF' }
    case 'video':   return { icon: ic(Film),     label: 'Video' }
    case 'event':   return { icon: ic(Calendar), label: 'Event' }
    case 'profile': return { icon: ic(User),     label: 'Profile' }
    default:        return null
  }
}

export function ReplyBar({ msg, myId, partnerName, onCancel }: Props) {
  const isOwn = msg.sender_id === myId
  const senderLabel = isOwn ? 'You' : (partnerName ?? 'Them')
  const mediaPreview = getPreview(msg)

  return (
    <View style={s.wrap}>
      <View style={s.accent} />
      <View style={s.body}>
        <Text style={s.sender}>{senderLabel}</Text>
        {mediaPreview ? (
          <View style={s.previewRow}>
            {mediaPreview.icon}
            <Text style={s.preview} numberOfLines={1}>{mediaPreview.label}</Text>
          </View>
        ) : (
          <Text style={s.preview} numberOfLines={1}>{msg.content ?? ''}</Text>
        )}
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
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  preview: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  cancel: { padding: 4 },
})

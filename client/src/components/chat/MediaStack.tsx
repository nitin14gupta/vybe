import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Play, Layers } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'
import type { MediaViewerItem, MediaViewType } from '@/components/chat/MediaViewerModal'

const STACK_WIDTH = 240
const STACK_HEIGHT = 224
const PAIR_HEIGHT = 160

interface Props {
  messages: Message[]
  isMine: boolean
  onOpen: (items: MediaViewerItem[], index: number) => void
}

function thumbUrl(msg: Message): string {
  // Videos have no separate thumbnail field yet — show the video itself as a still frame source.
  return msg.metadata?.thumbnail_url ?? msg.metadata?.url
}

function PlayBadge() {
  return (
    <View style={st.playBadge}>
      <Play size={16} color="#fff" fill="#fff" strokeWidth={0} />
    </View>
  )
}

export function MediaStack({ messages, isMine, onOpen }: Props) {
  const items: MediaViewerItem[] = messages.map(m => ({
    url: m.metadata!.url,
    type: m.content_type as MediaViewType,
  }))
  const isPending = messages.some(m => m.id.startsWith('_temp_'))
  const lastSentAt = messages[messages.length - 1].sent_at
  const timeStr = isPending ? '…' : new Date(lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleTap = (index: number) => { hTap(); onOpen(items, index) }

  // Two media: simple side-by-side pair, each tile opens the slider at its own index
  if (messages.length === 2) {
    return (
      <View style={[st.wrap, isMine ? st.wrapMine : st.wrapTheirs]}>
        <View style={st.pairRow}>
          {messages.map((m, i) => (
            <Pressable key={m.id} style={st.pairTile} onPress={() => handleTap(i)}>
              <Image source={{ uri: thumbUrl(m) }} style={st.pairImg} contentFit="cover" />
              {m.content_type === 'video' && <PlayBadge />}
            </Pressable>
          ))}
        </View>
        <Text style={[st.timeBelow, isMine ? st.timeBelowMine : st.timeBelowTheirs]}>{timeStr}</Text>
      </View>
    )
  }

  // Three or more: fanned stack, tap opens the slider starting from the first item
  const back = messages[2]
  const mid = messages[1]
  const front = messages[0]

  return (
    <View style={[st.wrap, isMine ? st.wrapMine : st.wrapTheirs]}>
      <Pressable style={st.stackWrap} onPress={() => handleTap(0)}>
        {back && (
          <View style={[st.stackImg, st.backCard]}>
            <Image source={{ uri: thumbUrl(back) }} style={st.stackImg} contentFit="cover" />
            <View style={st.dimOverlay} />
          </View>
        )}
        <View style={[st.stackImg, st.midCard]}>
          <Image source={{ uri: thumbUrl(mid) }} style={st.stackImg} contentFit="cover" />
          <View style={st.dimOverlayLight} />
        </View>
        <View style={[st.stackImg, st.frontCard]}>
          <Image source={{ uri: thumbUrl(front) }} style={st.stackImg} contentFit="cover" />
          {front.content_type === 'video' && <PlayBadge />}
          <View style={st.countBadge}>
            <Layers size={13} color="#fff" strokeWidth={2} />
            <Text style={st.countText}>{messages.length}</Text>
          </View>
        </View>
      </Pressable>
      <Text style={[st.timeBelow, isMine ? st.timeBelowMine : st.timeBelowTheirs]}>{timeStr}</Text>
    </View>
  )
}

const st = StyleSheet.create({
  wrap: { marginBottom: 4, maxWidth: '82%' },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  pairRow: { flexDirection: 'row', gap: 6 },
  pairTile: { width: (STACK_WIDTH - 6) / 2, height: PAIR_HEIGHT, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111' },
  pairImg: { width: '100%', height: '100%' },

  stackWrap: { width: STACK_WIDTH, height: STACK_HEIGHT + 30 },
  stackImg: {
    position: 'absolute',
    width: STACK_WIDTH - 36,
    height: STACK_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  backCard: {
    top: 22, left: 30,
    transform: [{ rotate: '-11deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  midCard: {
    top: 11, left: 15,
    transform: [{ rotate: '7deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  frontCard: {
    top: 0, left: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  dimOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dimOverlayLight: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  countBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  countText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: '#fff' },
  playBadge: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  timeBelow: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.inkDisabled, marginTop: 3 },
  timeBelowMine: { marginRight: 2 },
  timeBelowTheirs: { marginLeft: 2 },
})

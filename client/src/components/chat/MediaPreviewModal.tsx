import { View, Text, Pressable, StyleSheet, Dimensions, Modal } from 'react-native'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import { X, Send } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { PendingMedia } from '@/hooks/useMediaPicker'

const { width: SW, height: SH } = Dimensions.get('window')

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; p.play() })
  return <VideoView player={player} style={mp.media} contentFit="contain" nativeControls />
}

interface Props {
  media: PendingMedia | null
  onSend: () => void
  onCancel: () => void
}

export function MediaPreviewModal({ media, onSend, onCancel }: Props) {
  if (!media) return null

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={mp.overlay}>
        <View style={mp.mediaWrap}>
          {media.type === 'video'
            ? <VideoPreview uri={media.uri} />
            : <Image source={{ uri: media.uri }} style={mp.media} contentFit="contain" />
          }
        </View>

        <Pressable style={mp.closeBtn} onPress={onCancel} hitSlop={10}>
          <X size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>

        <View style={mp.bottom}>
          <Text style={mp.hint}>Ready to send?</Text>
          <Pressable style={mp.sendBtn} onPress={onSend}>
            <Send size={19} color="#111" strokeWidth={2.5} fill="#111" />
            <Text style={mp.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const mp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaWrap: {
    width: SW,
    height: SH * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: { width: SW, height: SH * 0.7 },
  closeBtn: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 52,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 99,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  sendLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 17,
    color: '#111',
  },
})

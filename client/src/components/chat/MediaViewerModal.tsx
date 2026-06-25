import { useEffect } from 'react'
import { Modal, View, Pressable, StyleSheet, Dimensions, StatusBar } from 'react-native'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { X } from 'lucide-react-native'

const { width: W, height: H } = Dimensions.get('window')

export type MediaViewType = 'image' | 'gif' | 'video'

interface Props {
  visible: boolean
  url: string
  type: MediaViewType
  onClose: () => void
}

function VideoViewer({ url }: { url: string }) {
  const player = useVideoPlayer(url, p => {
    p.loop = false
    p.play()
  })
  return (
    <VideoView
      player={player}
      style={{ width: W, height: H }}
      contentFit="contain"
      nativeControls
    />
  )
}

export function MediaViewerModal({ visible, url, type, onClose }: Props) {
  const translateY = useSharedValue(0)
  const bgOpacity = useSharedValue(1)

  useEffect(() => {
    if (visible) {
      translateY.value = 0
      bgOpacity.value = 1
    }
  }, [visible])

  const pan = Gesture.Pan()
    .activeOffsetY([15, Infinity])
    .onUpdate(e => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
        bgOpacity.value = Math.max(1 - e.translationY / 280, 0.15)
      }
    })
    .onEnd(e => {
      if (e.translationY > 80 || e.velocityY > 800) {
        translateY.value = withTiming(H, { duration: 220 })
        bgOpacity.value = withTiming(0, { duration: 200 }, () => runOnJS(onClose)())
      } else {
        translateY.value = withTiming(0)
        bgOpacity.value = withTiming(1)
      }
    })

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }))

  if (!visible) return null

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <Animated.View style={[StyleSheet.absoluteFill, s.bg, bgStyle]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.container, containerStyle]}>
          {type === 'video' ? (
            <VideoViewer url={url} />
          ) : (
            <Image
              source={{ uri: url }}
              style={{ width: W, height: H }}
              contentFit="contain"
            />
          )}
        </Animated.View>
      </GestureDetector>
      <Pressable style={s.closeBtn} onPress={onClose} hitSlop={12}>
        <X size={22} color="#fff" strokeWidth={2} />
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#000' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

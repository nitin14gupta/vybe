import { useEffect, useState, useCallback, useRef } from 'react'
import { Modal, View, Pressable, StyleSheet, Dimensions, StatusBar, FlatList } from 'react-native'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

const { width: W, height: H } = Dimensions.get('window')

export type MediaViewType = 'image' | 'gif' | 'video'

export interface MediaViewerItem {
  url: string
  type: MediaViewType
}

interface Props {
  visible: boolean
  items: MediaViewerItem[]
  initialIndex?: number
  onClose: () => void
}

function VideoViewer({ url, active }: { url: string; active: boolean }) {
  const player = useVideoPlayer(url, p => { p.loop = false })
  useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active, player])
  return (
    <VideoView
      player={player}
      style={{ width: W, height: H }}
      contentFit="contain"
      nativeControls
    />
  )
}

export function MediaViewerModal({ visible, items, initialIndex = 0, onClose }: Props) {
  const translateY = useSharedValue(0)
  const bgOpacity = useSharedValue(1)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (visible) {
      translateY.value = 0
      bgOpacity.value = 1
      setActiveIndex(initialIndex)
    }
  }, [visible, initialIndex])

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

  const handleMomentumEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W)
    setActiveIndex(idx)
  }, [])

  if (!visible || items.length === 0) return null

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
          <FlatList
            ref={listRef}
            data={items}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `${item.url}_${i}`}
            onMomentumScrollEnd={handleMomentumEnd}
            renderItem={({ item, index }) => (
              <View style={{ width: W, height: H, alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'video' ? (
                  <VideoViewer url={item.url} active={index === activeIndex} />
                ) : (
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: W, height: H }}
                    contentFit="contain"
                  />
                )}
              </View>
            )}
          />
        </Animated.View>
      </GestureDetector>

      {items.length > 1 && (
        <View style={s.counter}>
          <Animated.Text style={s.counterText}>{activeIndex + 1} / {items.length}</Animated.Text>
        </View>
      )}

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
  counter: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: '#fff',
  },
})

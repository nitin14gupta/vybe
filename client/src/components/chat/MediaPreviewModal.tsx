import { useState, useCallback, useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions, Modal, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import { X, Send, Play, Check, Crop } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ImagePicker from 'react-native-image-crop-picker'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { PendingMedia } from '@/hooks/useMediaPicker'

const { width: SW } = Dimensions.get('window')
const THUMB_SIZE = 56

function VideoPreview({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, p => { p.loop = true })
  useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active, player])
  return <VideoView player={player} style={mp.media} contentFit="contain" nativeControls />
}

interface Props {
  media: PendingMedia[]
  onSend: () => void
  onCancel: () => void
  onRemove: (index: number) => void
  onUpdate?: (index: number, updated: PendingMedia) => void
  actionLabel?: string
  titleLabel?: string
  cropAspectRatio?: number
  freeStyleCrop?: boolean
}

export function MediaPreviewModal({ media, onSend, onCancel, onRemove, onUpdate, actionLabel = 'Send', titleLabel = 'Ready to send?', cropAspectRatio = 1, freeStyleCrop = false }: Props) {
  const insets = useSafeAreaInsets()
  const [activeIndex, setActiveIndex] = useState(0)
  const mainListRef = useRef<FlatList>(null)
  const thumbListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (activeIndex >= media.length && media.length > 0) setActiveIndex(media.length - 1)
  }, [media.length, activeIndex])

  const handleMomentumEnd = useCallback((e: any) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SW))
  }, [])

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index)
    mainListRef.current?.scrollToIndex({ index, animated: true })
  }, [])

  const handleCrop = async (uri: string, index: number) => {
    try {
      const is16by9 = Math.abs(cropAspectRatio - 16 / 9) < 0.01
      const w = is16by9 ? 1600 : 800
      const h = is16by9 ? 900 : 800

      const options: any = {
        path: uri,
        cropping: true,
        mediaType: 'photo',

        // --- Custom UI Options (Black Palette) ---
        cropperToolbarTitle: 'Adjust Photo',
        cropperToolbarColor: '#000000', // Black header
        cropperStatusBarLight: false, // For dark status bar (light icons)
        cropperToolbarWidgetColor: '#FFFFFF', // White text/icons in header
        cropperActiveWidgetColor: '#111111', // Neutral dark color for active buttons (scale/rotate)
        cropperChooseColor: Colors.brandOrange, // iOS Choose button
        cropperCancelColor: '#FFFFFF', // iOS Cancel button
        hideBottomControls: false, // Ensure scale/rotate bottom bar is visible
        enableRotationGesture: true, // Allow two-finger rotation
      }

      if (freeStyleCrop) {
        options.freeStyleCropEnabled = true
      } else {
        options.freeStyleCropEnabled = false
        options.width = w
        options.height = h
      }

      const result = await ImagePicker.openCropper(options)

      if (onUpdate) {
        onUpdate(index, {
          ...media[index],
          uri: result.path,
          width: result.width,
          height: result.height,
        })
      }
    } catch (e) {
      console.log('Crop cancelled')
    }
  }

  if (media.length === 0) return null

  const multi = media.length > 1

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[mp.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={mp.header}>
          <Pressable style={mp.iconBtn} onPress={onCancel} hitSlop={10}>
            <X size={22} color="#fff" strokeWidth={2.5} />
          </Pressable>
          {multi && (
            <Text style={mp.headerTitle}>{activeIndex + 1} of {media.length}</Text>
          )}
          <View style={mp.iconBtn} />
        </View>

        <FlatList
          ref={mainListRef}
          data={media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item.uri}_${i}`}
          onMomentumScrollEnd={handleMomentumEnd}
          getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
          style={mp.mainList}
          renderItem={({ item, index }) => (
            <View style={mp.mediaWrap}>
              {item.type === 'video'
                ? <VideoPreview uri={item.uri} active={index === activeIndex} />
                : (
                  <>
                    <Image source={{ uri: item.uri }} style={mp.media} contentFit="contain" />
                    {onUpdate && index === activeIndex && (
                      <Pressable style={mp.cropOverlayBtn} onPress={() => handleCrop(item.uri, index)}>
                        <Crop size={24} color="#fff" strokeWidth={2.5} />
                      </Pressable>
                    )}
                  </>
                )
              }
            </View>
          )}
        />

        {multi && (
          <FlatList
            ref={thumbListRef}
            data={media}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `thumb_${item.uri}_${i}`}
            style={mp.thumbStrip}
            contentContainerStyle={mp.thumbStripContent}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => goToIndex(index)} style={mp.thumbWrap}>
                <Image
                  source={{ uri: item.uri }}
                  style={[mp.thumb, index === activeIndex && mp.thumbActive]}
                  contentFit="cover"
                />
                {item.type === 'video' && (
                  <View style={mp.thumbPlayBadge}>
                    <Play size={10} color="#fff" fill="#fff" strokeWidth={0} />
                  </View>
                )}
                <Pressable
                  style={mp.thumbRemove}
                  hitSlop={8}
                  onPress={() => {
                    onRemove(index)
                    if (index <= activeIndex) setActiveIndex(i => Math.max(0, i - 1))
                  }}
                >
                  <X size={10} color="#fff" strokeWidth={3} />
                </Pressable>
              </Pressable>
            )}
          />
        )}

        <View style={mp.footer}>
          <Text style={mp.hint}>
            {multi ? `${media.length} selected` : titleLabel}
          </Text>
          <View style={mp.sendBtn}>
            <PrimaryButton
              label={`${actionLabel}${multi ? ` ${media.length}` : ''}`}
              onPress={onSend}
              icon={actionLabel === 'Add' ? (
                <Check size={19} color={Colors.background} strokeWidth={2.5} />
              ) : (
                <Send size={19} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
              )}
            />
          </View>
        </View>
      </View>

    </Modal>
  )
}

const mp = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  cropOverlayBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: '#fff',
  },
  mainList: { flex: 1 },
  mediaWrap: {
    width: SW,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: { width: SW, height: '100%' },
  thumbStrip: { flexGrow: 0, marginBottom: 12 },
  thumbStripContent: { paddingHorizontal: 12, gap: 8 },
  thumbWrap: { width: THUMB_SIZE, height: THUMB_SIZE },
  thumb: {
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: Colors.brandOrange },
  thumbPlayBadge: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
  },
  thumbRemove: {
    position: 'absolute',
    top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
  sendBtn: { width: '100%' },
})

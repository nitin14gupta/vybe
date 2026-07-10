import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Modal, Dimensions, Pressable, ActivityIndicator, Image as RNImage } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'expo-image'
import { X, Check } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap, hSuccess, hError } from '@/lib/haptics'

import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS
} from 'react-native-reanimated'

const AnimatedImage = Animated.createAnimatedComponent(Image)
const SW = Dimensions.get('window').width

interface Props {
  visible: boolean
  uri: string
  originalWidth?: number
  originalHeight?: number
  aspectRatio?: number
  onCrop: (croppedUri: string) => void
  onCancel: () => void
}

export function ImageCropperModal({ visible, uri, originalWidth, originalHeight, aspectRatio = 1, onCrop, onCancel }: Props) {
  const insets = useSafeAreaInsets()
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  // Reanimated Shared Values
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }))

  useEffect(() => {
    if (visible && uri) {
      if (originalWidth && originalHeight) {
        setDimensions({ w: originalWidth, h: originalHeight })
      } else {
        setDimensions(null)
        RNImage.getSize(
          uri,
          (w, h) => setDimensions({ w, h }),
          () => hError()
        )
      }
      scale.value = 1
      savedScale.value = 1
      translateX.value = 0
      translateY.value = 0
      savedTranslateX.value = 0
      savedTranslateY.value = 0
    }
  }, [visible, uri, originalWidth, originalHeight])

  if (!visible) return null

  const cropBoxW = SW
  const cropBoxH = SW / (aspectRatio || 1)
  
  let baseImageW = cropBoxW
  let baseImageH = cropBoxH
  let fitScale = 1

  if (dimensions) {
    fitScale = Math.max(cropBoxW / dimensions.w, cropBoxH / dimensions.h)
    baseImageW = dimensions.w * fitScale
    baseImageH = dimensions.h * fitScale
  }

  const ready = !!dimensions

  // Helper worklet to clamp pan based on current scale
  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.max(min, Math.min(value, max))
  }

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const maxX = Math.max(0, (baseImageW * scale.value - cropBoxW) / 2)
      const maxY = Math.max(0, (baseImageH * scale.value - cropBoxH) / 2)

      translateX.value = clamp(savedTranslateX.value + e.translationX, -maxX, maxX)
      translateY.value = clamp(savedTranslateY.value + e.translationY, -maxY, maxY)
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, 3)

      // Also clamp translations so zooming out doesn't leave the image out of bounds
      const maxX = Math.max(0, (baseImageW * scale.value - cropBoxW) / 2)
      const maxY = Math.max(0, (baseImageH * scale.value - cropBoxH) / 2)

      translateX.value = clamp(translateX.value, -maxX, maxX)
      translateY.value = clamp(translateY.value, -maxY, maxY)
    })
    .onEnd(() => {
      savedScale.value = scale.value
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture)

  const handleCrop = async () => {
    if (!dimensions || processing) return
    hTap()
    setProcessing(true)
    try {
      const currentScale = scale.value
      const totalScale = fitScale * currentScale

      // Calculate crop rect in original image coordinates
      const cropX = ((baseImageW * currentScale - cropBoxW) / 2 - translateX.value) / totalScale
      const cropY = ((baseImageH * currentScale - cropBoxH) / 2 - translateY.value) / totalScale
      const cropW = cropBoxW / totalScale
      const cropH = cropBoxH / totalScale

      const safeX = Math.max(0, Math.min(cropX, dimensions.w))
      const safeY = Math.max(0, Math.min(cropY, dimensions.h))
      const safeW = Math.min(cropW, dimensions.w - safeX)
      const safeH = Math.min(cropH, dimensions.h - safeY)

      const result = await manipulateAsync(
        uri,
        [{ crop: { originX: safeX, originY: safeY, width: safeW, height: safeH } }],
        { compress: 0.85, format: SaveFormat.JPEG }
      )
      hSuccess()
      onCrop(result.uri)
    } catch (e) {
      hError()
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal visible animationType="slide" transparent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={s.header}>
            <Pressable onPress={onCancel} style={s.iconBtn} hitSlop={10}>
              <X size={24} color="#fff" strokeWidth={2.5} />
            </Pressable>
            <Text style={s.title}>Crop Photo</Text>
            <View style={s.iconBtn} />
          </View>

          <View style={s.center}>
            {!ready ? (
              <ActivityIndicator color={Colors.brandOrange} />
            ) : (
              <View style={[s.cropBox, { height: cropBoxH }]}>
                <GestureDetector gesture={composedGesture}>
                  <Animated.View style={s.gestureContainer}>
                    <AnimatedImage
                      source={{ uri }}
                      style={[{ width: baseImageW, height: baseImageH }, animatedStyle]}
                      contentFit="fill"
                    />
                  </Animated.View>
                </GestureDetector>
                <View style={s.overlay} pointerEvents="none" />
              </View>
            )}
          </View>

          <View style={s.footer}>
            <Text style={s.hintText}>Pinch to zoom and drag to adjust</Text>

            <Pressable style={s.cropBtn} onPress={handleCrop} disabled={!ready || processing}>
              {processing ? (
                <ActivityIndicator color="#111" />
              ) : (
                <>
                  <Check size={20} color="#111" strokeWidth={3} />
                  <Text style={s.cropBtnText}>Apply Crop</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 56,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontFamily: FontFamily.bodySemiBold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cropBox: {
    width: SW,
    backgroundColor: '#111',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  footer: { padding: 24, paddingBottom: 40 },
  hintText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  cropBtn: {
    backgroundColor: '#fff',
    height: 52, borderRadius: 26,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cropBtnText: { color: '#111', fontSize: 16, fontFamily: FontFamily.bodySemiBold },
})

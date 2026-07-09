import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Modal, Dimensions, ScrollView, Pressable, ActivityIndicator, Image as RNImage } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'expo-image'
import { X, Check } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap, hSuccess, hError } from '@/lib/haptics'

const SW = Dimensions.get('window').width

interface Props {
  visible: boolean
  uri: string
  onCrop: (croppedUri: string) => void
  onCancel: () => void
}

export function ImageCropperModal({ visible, uri, onCrop, onCancel }: Props) {
  const insets = useSafeAreaInsets()
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  const offsetRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)

  useEffect(() => {
    if (visible && uri) {
      setDimensions(null)
      offsetRef.current = { x: 0, y: 0 }
      zoomRef.current = 1
      RNImage.getSize(
        uri,
        (w, h) => setDimensions({ w, h }),
        () => hError()
      )
    }
  }, [visible, uri])

  if (!visible) return null

  const size = SW // 1:1 viewport size
  let imageW = size
  let imageH = size
  let scale = 1

  if (dimensions) {
    scale = Math.max(size / dimensions.w, size / dimensions.h)
    imageW = dimensions.w * scale
    imageH = dimensions.h * scale
  }

  const initialOffsetX = Math.max(0, (imageW - size) / 2)
  const initialOffsetY = Math.max(0, (imageH - size) / 2)

  // Wait until we have dimensions to render the cropper
  const ready = !!dimensions

  const handleScroll = (e: any) => {
    offsetRef.current = e.nativeEvent.contentOffset
    if (e.nativeEvent.zoomScale !== undefined) {
      zoomRef.current = e.nativeEvent.zoomScale
    }
  }

  const handleCrop = async () => {
    if (!dimensions || processing) return
    hTap()
    setProcessing(true)
    try {
      const z = zoomRef.current
      const cropX = offsetRef.current.x / (scale * z)
      const cropY = offsetRef.current.y / (scale * z)
      const cropW = size / (scale * z)
      const cropH = size / (scale * z)

      // Ensure we don't go out of bounds due to floating point rounding
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
            <View style={s.cropBox}>
              <ScrollView
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                maximumZoomScale={3}
                minimumZoomScale={1}
                contentOffset={{ x: initialOffsetX, y: initialOffsetY }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={s.scrollView}
                contentContainerStyle={{ width: imageW, height: imageH }}
              >
                <Image
                  source={{ uri }}
                  style={{ width: imageW, height: imageH }}
                  contentFit="fill"
                />
              </ScrollView>
              {/* Overlay lines or mask could go here, but a clean box is fine */}
              <View style={s.overlay} pointerEvents="none" />
            </View>
          )}
        </View>

        <View style={s.footer}>
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
    width: SW, height: SW,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  scrollView: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  footer: { padding: 24, paddingBottom: 40 },
  cropBtn: {
    backgroundColor: '#fff',
    height: 52, borderRadius: 26,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cropBtnText: { color: '#111', fontSize: 16, fontFamily: FontFamily.bodySemiBold },
})

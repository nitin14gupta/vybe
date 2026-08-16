import { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, runOnJS, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListFilter } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const DISPLAY_MS = 2600

// Same "amazing and smooth" bottom-slide feel as the offline pill (see
// Pill.tsx / NoInternetBanner.tsx), just anchored to the top with a
// translateY spring-in instead of a plain opacity fade — used to confirm an
// action (like applying calendar filters) without blocking the screen.
export function FilterUpdatedToast({ visible, onView, onDismiss }: {
  visible: boolean
  onView: () => void
  onDismiss: () => void
}) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-80)
  const opacity = useSharedValue(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) return
    if (timerRef.current) clearTimeout(timerRef.current)
    translateY.value = withSpring(0, { damping: 16, stiffness: 180 })
    opacity.value = withTiming(1, { duration: 150 })
    timerRef.current = setTimeout(() => {
      translateY.value = withTiming(-80, { duration: 220, easing: Easing.in(Easing.cubic) })
      opacity.value = withTiming(0, { duration: 180 }, () => runOnJS(onDismiss)())
    }, DISPLAY_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!visible) return null

  return (
    <Animated.View style={[s.wrap, { top: insets.top + 8 }, animStyle]} pointerEvents="box-none">
      <Animated.View style={s.pill}>
        <ListFilter size={14} color={Colors.inkPrimary} strokeWidth={2} />
        <Text style={s.text}>Filters updated</Text>
        <Pressable onPress={() => { hTap(); onView() }} style={s.viewBtn} hitSlop={8}>
          <Text style={s.viewText}>View</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.elevated,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  text: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkPrimary },
  viewBtn: { backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  viewText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.background },
})

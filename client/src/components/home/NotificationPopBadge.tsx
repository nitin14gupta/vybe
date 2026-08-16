import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay, Easing,
} from 'react-native-reanimated'
import { Heart } from 'lucide-react-native'
import { useNotifStore } from '@/store/notifStore'
import { Colors, FontFamily } from '@/constants'

const HOLD_MS = 3000

export function NotificationPopBadge() {
  const unreadCount = useNotifStore(s => s.unreadCount)
  const popNonce = useNotifStore(s => s.popNonce)
  const progress = useSharedValue(0)

  useEffect(() => {
    if (popNonce === 0) return
    progress.value = withSequence(
      withSpring(1, { damping: 15, stiffness: 220 }),
      withDelay(HOLD_MS, withTiming(0, { duration: 220, easing: Easing.in(Easing.ease) })),
    )
  }, [popNonce, progress])

  const calloutStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.6 + progress.value * 0.4 },
      { translateY: (1 - progress.value) * -6 },
    ],
  }))

  if (unreadCount <= 0) return null

  return (
    <>
      <View style={s.dot} />
      <Animated.View style={[s.calloutWrap, calloutStyle]} pointerEvents="none">
        <View style={s.arrow} />
        <View style={s.bubble}>
          <Heart size={14} color={Colors.white} fill={Colors.white} strokeWidth={0} />
          <Text style={s.bubbleText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      </Animated.View>
    </>
  )
}

const s = StyleSheet.create({
  dot: {
    position: 'absolute', top: -2, right: -2,
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: Colors.notificationRed,
    borderWidth: 1.2, borderColor: Colors.background,
  },
  calloutWrap: {
    position: 'absolute',
    top: 28,
    left: -34,
    right: -34,
    alignItems: 'center',
  },
  // A rounded, rotated square reads as a soft teardrop-style pointer —
  // much cleaner than a hard CSS-triangle point. Sits half-behind the
  // bubble (negative margin) so only the rounded tip peeks above it.
  arrow: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.notificationRed,
    transform: [{ rotate: '45deg' }],
    marginBottom: -8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.notificationRed,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 6,
    shadowColor: Colors.black, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bubbleText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.white },
})

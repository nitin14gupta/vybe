import React, { useEffect, useRef } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, runOnJS, Easing,
} from 'react-native-reanimated'
import { usePillStore } from '@/store/pillStore'
import { FontFamily, Colors, withOpacity } from '@/constants'
import { LogoMark } from './LogoMark'

const { height } = Dimensions.get('window')

// A quiet slide + fade, no overshoot — reads as calm and native rather than
// bouncy. This component is what every showPill() call in the app renders
// through, styled to match a small logo-badge toast (like district/big apps),
// not a bright colored banner.
export function PillOverlay() {
  const { message, visible, type, hide } = usePillStore()
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(10)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current)
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) })
      timerRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 220 }, () => runOnJS(hide)())
        translateY.value = withTiming(10, { duration: 220, easing: Easing.in(Easing.cubic) })
      }, 2200)
    } else {
      opacity.value = withTiming(0, { duration: 200 })
      translateY.value = 10
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible, message])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const badgeTint = type === 'error' ? withOpacity(Colors.destructive, 0.2) : withOpacity(Colors.inkPrimary, 0.12)

  if (!visible && opacity.value === 0) return null

  return (
    <Animated.View style={[s.pill, { top: height * 0.75 }, animStyle]} pointerEvents="none">
      <View style={[s.badge, { backgroundColor: badgeTint }]}>
        <LogoMark size={15} />
      </View>
      <Text style={s.text}>{message}</Text>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: Dimensions.get('window').width - 64,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(38,38,38,0.9)',
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkPrimary,
    flexShrink: 1,
    lineHeight: 20,
  },
})

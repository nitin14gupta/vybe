import React, { useEffect, useRef } from 'react'
import { Dimensions, StyleSheet, Text } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, runOnJS,
} from 'react-native-reanimated'
import { usePillStore } from '@/store/pillStore'
import { FontFamily } from '@/constants'

const { height } = Dimensions.get('window')

export function PillOverlay() {
  const { message, visible, type, hide } = usePillStore()
  const opacity = useSharedValue(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current)
      opacity.value = withTiming(1, { duration: 150 })
      timerRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 250 }, () => runOnJS(hide)())
      }, 2200)
    } else {
      opacity.value = withTiming(0, { duration: 200 })
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible, message])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  const bg =
    type === 'success' ? 'rgba(255,107,53,0.92)' :
    type === 'error'   ? 'rgba(30,30,30,0.96)' :
                         'rgba(30,30,30,0.96)'

  const textColor = type === 'success' ? '#111' : '#fff'

  if (!visible && opacity.value === 0) return null

  return (
    <Animated.View style={[s.pill, { top: height * 0.75, backgroundColor: bg }, animStyle]} pointerEvents="none">
      <Text style={[s.text, { color: textColor }]}>{message}</Text>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    left: 32,
    right: 32,
    zIndex: 9999,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  text: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})

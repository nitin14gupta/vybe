import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { CheckCircle } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

export function PaymentStatusOverlay({
  title = 'Payment Confirmed!',
  subtitle = 'Taking you to your ticket…',
}: {
  title?: string
  subtitle?: string
}) {
  const scale   = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={s.root}>
      <Animated.View style={[s.circle, style]}>
        <CheckCircle size={48} color="#fff" strokeWidth={2} />
      </Animated.View>
      <Text style={s.label}>{title}</Text>
      <Text style={s.sub}>{subtitle}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 50 },
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accentGreen, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, marginTop: 8 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary },
})

import { useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { Colors, FontFamily } from '@/constants'

export type ToastType = 'error' | 'success' | 'info'

interface Props {
  message: string
  type?: ToastType
}

const BG: Record<ToastType, string> = {
  error:   '#C0392B',
  success: '#1B8A4C',
  info:    '#2C2C2C',
}

const PREFIX: Record<ToastType, string> = {
  error:   '✕  ',
  success: '✓  ',
  info:    '',
}

export function ToastBanner({ message, type = 'info' }: Props) {
  const opacity = useSharedValue(0)
  const ty = useSharedValue(14)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 })
    ty.value = withSpring(0, { damping: 18, stiffness: 260 })

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 220 })
      ty.value = withTiming(10, { duration: 220 })
    }, 2200)

    return () => clearTimeout(t)
  }, [])

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }))

  return (
    <Animated.View style={[styles.banner, { backgroundColor: BG[type] }, anim]}>
      <Text style={styles.text}>{PREFIX[type]}{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 96,
    left: 20,
    right: 20,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  text: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
})

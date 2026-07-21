import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withTiming, interpolateColor, Easing,
} from 'react-native-reanimated'
import { Colors } from '@/constants'

const HEIGHT = 220
const CYCLE_MS = 7000

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient)
const PALETTE_A = [Colors.brandCoral, Colors.brandOrange, Colors.background]
const PALETTE_B = [Colors.brandOrange, Colors.brandCoral, Colors.background]

export function HomeGradientBackdrop() {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    )
  }, [])

  const animatedProps = useAnimatedProps(() => ({
    colors: [
      interpolateColor(progress.value, [0, 1], [PALETTE_A[0], PALETTE_B[0]]),
      interpolateColor(progress.value, [0, 1], [PALETTE_A[1], PALETTE_B[1]]),
      interpolateColor(progress.value, [0, 1], [PALETTE_A[2], PALETTE_B[2]]),
    ],
  })) as any

  return (
    <AnimatedGradient
      animatedProps={animatedProps}
      colors={PALETTE_A as unknown as [string, string, string]}
      locations={[0, 0, 1]}
      style={s.root}
      pointerEvents="none"
    />
  )
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: HEIGHT,
  },
})

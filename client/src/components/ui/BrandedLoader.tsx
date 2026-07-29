import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated'
import { LogoMark } from './LogoMark'

interface Props {
  size?: number
}

export function BrandedLoader({ size = 36 }: Props) {
  const opacity = useSharedValue(0.35)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <View style={s.root}>
      <Animated.View style={style}>
        <LogoMark size={size} />
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
})

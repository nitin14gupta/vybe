import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated'
import { Colors } from '@/constants'

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
        ),
        -1,
        false,
      ),
    )
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.View style={[s.dot, style]} />
}

export function TypingIndicator() {
  return (
    <View style={[s.wrap, s.wrapTheirs]}>
      <View style={[s.bubble, s.bubbleTheirs]}>
        <View style={s.dots}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={150} />
          <AnimatedDot delay={300} />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { marginBottom: 12, maxWidth: '82%' },
  wrapTheirs: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bubbleTheirs: { backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandOrange },
})

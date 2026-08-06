import { memo, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { Colors, Spacing } from '@/constants'

const DOT_SIZE = 6
const DOT_ACTIVE_WIDTH = 20

const Dot = memo(function Dot({ isActive, isDone, delay }: { isActive: boolean; isDone: boolean; delay: number }) {
  const width = useSharedValue(DOT_SIZE)
  const filled = useSharedValue(isDone || isActive ? 1 : 0)

  useEffect(() => {
    width.value = withDelay(delay, withSpring(isActive ? DOT_ACTIVE_WIDTH : DOT_SIZE, { damping: 16, stiffness: 220 }))
    filled.value = withDelay(delay, withSpring(isDone || isActive ? 1 : 0, { damping: 16, stiffness: 220 }))
  }, [isActive, isDone, delay])

  const style = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: filled.value > 0.5 ? Colors.inkPrimary : Colors.divider,
  }))

  return <Animated.View style={[s.dot, style]} />
})

function StepDotsBase({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={s.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} isActive={i + 1 === step} isDone={i + 1 < step} delay={i * 60} />
      ))}
    </Animated.View>
  )
}

export const StepDots = memo(StepDotsBase)

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 10,
    paddingBottom: Spacing.sectionGap,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
})

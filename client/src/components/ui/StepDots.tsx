import { memo, useEffect } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { Colors, Spacing, withOpacity } from '@/constants'

const DOT_SIZE = 6
const DOT_ACTIVE_WIDTH = 20
const OVERLAY_INACTIVE_COLOR = withOpacity(Colors.inkPrimary, 0.4)

const Dot = memo(function Dot({
  isActive,
  isDone,
  delay,
  overlay,
  fillColor,
  emptyColor,
}: {
  isActive: boolean
  isDone: boolean
  delay: number
  overlay: boolean
  fillColor: string
  emptyColor: string
}) {
  const width = useSharedValue(DOT_SIZE)
  const filled = useSharedValue((overlay ? isActive : isDone || isActive) ? 1 : 0)

  useEffect(() => {
    width.value = withDelay(delay, withSpring(isActive ? DOT_ACTIVE_WIDTH : DOT_SIZE, { damping: 16, stiffness: 220 }))
    filled.value = withDelay(delay, withSpring((overlay ? isActive : isDone || isActive) ? 1 : 0, { damping: 16, stiffness: 220 }))
  }, [isActive, isDone, delay, overlay])

  const style = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: filled.value > 0.5 ? fillColor : emptyColor,
  }))

  return <Animated.View style={[s.dot, style]} />
})

interface StepDotsProps {
  step: number
  total?: number
  /** 'overlay' renders compact dots (no screen padding) for use atop photo carousels; only the active dot fills. */
  variant?: 'default' | 'overlay'
  /** Dark dots for light-background screens (the theme colors are dark-canvas white). */
  onLight?: boolean
  style?: ViewStyle
}

function StepDotsBase({ step, total = 5, variant = 'default', onLight = false, style }: StepDotsProps) {
  const overlay = variant === 'overlay'
  const fillColor = onLight ? '#16181D' : Colors.inkPrimary
  const emptyColor = onLight ? 'rgba(0,0,0,0.14)' : overlay ? OVERLAY_INACTIVE_COLOR : Colors.divider
  return (
    <Animated.View entering={FadeIn.duration(350)} style={[s.row, overlay && s.rowOverlay, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} isActive={i + 1 === step} isDone={i + 1 < step} delay={i * 60} overlay={overlay} fillColor={fillColor} emptyColor={emptyColor} />
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
  rowOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
})

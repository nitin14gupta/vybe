import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated'
import { Colors } from '@/constants'

function WaveBar({
  index,
  isActive,
  maxH,
  minH,
  duration,
  color,
}: {
  index: number
  isActive: boolean
  maxH: number
  minH: number
  duration: number
  color: string
}) {
  const scaleY = useSharedValue(minH)

  useEffect(() => {
    if (isActive) {
      scaleY.value = withDelay(
        index * 40,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration }),
            withTiming(minH, { duration }),
          ),
          -1,
        ),
      )
    } else {
      cancelAnimation(scaleY)
      scaleY.value = withTiming(minH, { duration: 200 })
    }
  }, [isActive])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }))

  return <Animated.View style={[styles.bar, { backgroundColor: color }, animStyle]} />
}

// ── Recording wave — 14 uniform tall bars staggered ──────────────────────────

export function RecordingWave({ isActive }: { isActive: boolean }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 14 }, (_, i) => (
        <WaveBar
          key={i}
          index={i}
          isActive={isActive}
          maxH={1}
          minH={0.15}
          duration={325 + (i % 3) * 55}
          color={Colors.brandOrange}
        />
      ))}
    </View>
  )
}

// ── Playback wave — equalizer with natural waveform heights ───────────────────

const WAVE_HEIGHTS = [0.25, 0.55, 0.85, 0.65, 1.0, 0.45, 0.8, 0.4, 0.9, 0.6, 0.75, 0.35, 0.7, 0.5, 0.95, 0.45, 0.7, 0.3, 0.6, 0.5]

export function PlaybackWave({
  isActive,
  compact = false,
  color,
}: {
  isActive: boolean
  compact?: boolean
  color?: string
}) {
  const barColor = color ?? Colors.brandOrange
  return (
    <View style={[styles.row, compact && styles.compact]}>
      {WAVE_HEIGHTS.map((h, i) => (
        <WaveBar
          key={i}
          index={i}
          isActive={isActive}
          maxH={h}
          minH={h * 0.18}
          duration={280 + (i % 5) * 70}
          color={barColor}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    height: 44,
  },
  compact: {
    height: 28,
  },
  bar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    transformOrigin: 'center',
  } as any,
})

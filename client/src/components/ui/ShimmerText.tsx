import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated'
import { Colors } from '@/constants'

const SWEEP_WIDTH = 100
const DURATION_MS = 1800

interface Props {
  children: string
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  /** Resting color while the sweep isn't over it — must read as visibly
   * dimmer than `style`'s color, since the whole effect is the sweep
   * brightening the text back up as it passes. Defaults to inkSecondary. */
  dimColor?: string
}

// A bright streak sweeps across the text on a loop, brightening each letter
// as it passes — same idea as the classic CSS `background-clip: text`
// shimmer, just built for RN with MaskedView instead (there's no background-
// clip equivalent here). The resting state MUST be dimmer than the sweep
// color or there's no contrast and the effect is invisible — that was the
// bug in the first pass (bright text + a white sweep on top of it, both
// already close to white).
export function ShimmerText({ children, style, numberOfLines, dimColor = Colors.inkSecondary }: Props) {
  const [width, setWidth] = useState(0)
  const progress = useSharedValue(0)

  const flatStyle = useMemo(() => StyleSheet.flatten(style) ?? {}, [style])
  const brightColor = (flatStyle.color as string) ?? Colors.inkPrimary
  const dimStyle = useMemo(() => [style, { color: dimColor }], [style, dimColor])

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION_MS, easing: Easing.linear }),
      -1,
      false,
    )
  }, [progress])

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SWEEP_WIDTH + progress.value * (width + SWEEP_WIDTH * 2) }],
  }))

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <Text style={dimStyle} numberOfLines={numberOfLines}>{children}</Text>
      {width > 0 && (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={<Text style={style} numberOfLines={numberOfLines}>{children}</Text>}
        >
          <Animated.View style={[styles.sweep, sweepStyle]}>
            <LinearGradient
              colors={['transparent', brightColor, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </MaskedView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sweep: { width: SWEEP_WIDTH, height: '100%' },
})

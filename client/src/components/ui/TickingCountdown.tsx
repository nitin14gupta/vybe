import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated'
import { FontFamily } from '@/constants'
import { formatHMS } from '@/lib/countdown'

const SPRING = { damping: 18, stiffness: 280, mass: 0.3 }

interface Props {
  totalSeconds: number
  digitColor?: string
  fontSize?: number
  alwaysShowHours?: boolean
  /** Match whatever font sits next to this — different typefaces have
   * different baselines/cap-heights, so mismatched fonts can never be
   * pixel-aligned by margin alone. Defaults to bodySemiBold (Satoshi),
   * the usual "sits inline in a button/label" font in this app. */
  fontFamily?: string
}

function RollingDigit({ n, value, height, width, fontSize, digitColor, fontFamily }: {
  n: number
  value: SharedValue<number>
  height: number
  width: number
  fontSize: number
  digitColor: string
  fontFamily: string
}) {
  const style = useAnimatedStyle(() => {
    const current = ((value.value % 10) + 10) % 10
    let offset = (10 + n - current) % 10
    let y = offset * height
    if (offset > 5) y -= 10 * height
    return { transform: [{ translateY: y }] }
  })
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { width, height, alignItems: 'center' }, style]}>
      <Text style={{ fontFamily, fontSize, lineHeight: height, color: digitColor }}>
        {n}
      </Text>
    </Animated.View>
  )
}

function DigitColumn({ digit, fontSize, digitColor, fontFamily }: {
  digit: number
  fontSize: number
  digitColor: string
  fontFamily: string
}) {
  const height = Math.round(fontSize * 1.25)
  const width = Math.round(fontSize * 0.66)
  const value = useSharedValue(digit)

  useEffect(() => { value.value = withSpring(digit, SPRING) }, [digit, value])

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {Array.from({ length: 10 }, (_, n) => (
        <RollingDigit key={n} n={n} value={value} height={height} width={width} fontSize={fontSize} digitColor={digitColor} fontFamily={fontFamily} />
      ))}
    </View>
  )
}

export function TickingCountdown({
  totalSeconds, digitColor = '#fff', fontSize = 16, alwaysShowHours = false,
  fontFamily = FontFamily.bodySemiBold,
}: Props) {
  const { h, m, s } = formatHMS(totalSeconds)
  const showHours = alwaysShowHours || h !== '00'
  const groups = showHours ? [h, m, s] : [m, s]

  return (
    <View style={styles.row}>
      {groups.map((group, gi) => (
        <View key={gi} style={styles.row}>
          {gi > 0 && (
            <Text style={{ fontFamily, fontSize, color: digitColor, marginHorizontal: 1 }}>
              :
            </Text>
          )}
          <View style={styles.row}>
            {group.split('').map((ch, ci) => (
              <DigitColumn key={ci} digit={Number(ch)} fontSize={fontSize} digitColor={digitColor} fontFamily={fontFamily} />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
})

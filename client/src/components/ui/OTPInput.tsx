import { useRef, useEffect } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Colors, FontFamily, Radius } from '@/constants'

interface Props {
  value: string
  onChange: (value: string) => void
  error?: boolean
  autoFocus?: boolean
}

const BOX_COUNT = 6

export function OTPInput({ value, onChange, error, autoFocus }: Props) {
  const inputs = useRef<(TextInput | null)[]>(Array(BOX_COUNT).fill(null))
  const shake = useSharedValue(0)

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }))

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(0, { duration: 90 }),
      )
    }
  }, [error])

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputs.current[0]?.focus(), 100)
  }, [autoFocus])

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1)
    const chars = value.split('')
    chars[index] = digit
    const next = chars.join('')
    onChange(next)

    if (digit && index < BOX_COUNT - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (value[index]) {
        const chars = value.split('')
        chars[index] = ''
        onChange(chars.join(''))
      } else if (index > 0) {
        inputs.current[index - 1]?.focus()
        const chars = value.split('')
        chars[index - 1] = ''
        onChange(chars.join(''))
      }
    }
  }

  return (
    <Animated.View style={[styles.row, shakeStyle]}>
      {Array.from({ length: BOX_COUNT }).map((_, i) => {
        const filled = !!value[i]
        return (
          <TextInput
            key={i}
            ref={r => { inputs.current[i] = r }}
            style={[
              styles.box,
              filled && !error && styles.filledBox,
              error && styles.errorBox,
            ]}
            value={value[i] || ''}
            onChangeText={text => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            caretHidden
            selectTextOnFocus
          />
        )
      })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    textAlign: 'center',
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
  },
  filledBox: {
    borderColor: Colors.brandOrange,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  errorBox: {
    borderColor: Colors.brandCoral,
    shadowColor: Colors.brandCoral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
})

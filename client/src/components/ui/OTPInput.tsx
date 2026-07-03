import { useRef, useEffect, useState } from 'react'
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
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)
  const shake = useSharedValue(0)
  const activeIndex = Math.min(value.length, BOX_COUNT - 1)

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
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 100)
  }, [autoFocus])

  const handleChange = (text: string) => {
    onChange(text.replace(/\D/g, '').slice(0, BOX_COUNT))
  }

  return (
    <Animated.View style={[styles.row, shakeStyle]}>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={BOX_COUNT}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
      />
      <View style={styles.boxRow} pointerEvents="none">
        {Array.from({ length: BOX_COUNT }).map((_, i) => {
          const active = focused && i === activeIndex
          return (
            <View
              key={i}
              style={[
                styles.box,
                active && !error && styles.activeBox,
                error && styles.errorBox,
              ]}
            >
              <Animated.Text style={styles.boxText}>{value[i] || ''}</Animated.Text>
            </View>
          )
        })}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  boxRow: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
  },
  activeBox: {
    borderColor: Colors.brandOrange,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  errorBox: {
    borderColor: Colors.brandCoral,
    shadowColor: Colors.brandCoral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
})

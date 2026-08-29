import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, ComponentSize } from '@/constants'

interface Props {
  label: string
  onPress: () => void
  disabled?: boolean
  style?: ViewStyle
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function TextLinkButton({ label, onPress, disabled, style }: Props) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      onPress={!disabled ? () => { hTap(); onPress() } : undefined}
      onPressIn={() => { if (!disabled) pressScale.value = withSpring(0.96, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
      disabled={disabled}
      style={[styles.btn, style, pressStyle]}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{label}</Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    height: ComponentSize.btnGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkSecondary,
  },
  disabledText: {
    color: Colors.inkDisabled,
  },
})

import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Colors, FontFamily, ComponentSize, Radius } from '@/constants'

interface Props {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
}

export function OutlineButton({ label, onPress, disabled, loading, style }: Props) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      onPressIn={() => { if (!disabled) scale.value = withSpring(0.97, { duration: 120 }) }}
      onPressOut={() => { scale.value = withSpring(1, { duration: 120 }) }}
      disabled={disabled || loading}
    >
      <Animated.View style={[styles.btn, style, animStyle]}>
        {loading ? (
          <ActivityIndicator color={Colors.inkPrimary} size="small" />
        ) : (
          <Text style={[styles.text, disabled && styles.disabledText]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  disabledText: {
    color: Colors.inkDisabled,
  },
})

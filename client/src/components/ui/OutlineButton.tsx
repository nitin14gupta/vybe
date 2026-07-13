import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, ComponentSize, Radius } from '@/constants'

interface Props {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  style?: ViewStyle
}

export function OutlineButton({ label, onPress, disabled, loading, icon, style }: Props) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      onPressIn={() => { if (!disabled) { scale.value = withSpring(0.97, { duration: 120 }); hTap() } }}
      onPressOut={() => { scale.value = withSpring(1, { duration: 120 }) }}
      disabled={disabled || loading}
    >
      <Animated.View style={[styles.btn, style, animStyle]}>
        {loading ? (
          <ActivityIndicator color={Colors.inkPrimary} size="small" />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text style={[styles.text, disabled && styles.disabledText]}>{label}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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

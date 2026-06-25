import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, ComponentSize, Radius } from '@/constants'

interface Props {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
}

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient)

export function PrimaryButton({ label, onPress, disabled, loading, style }: Props) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, { duration: 120 })
      hTap()
    }
  }
  const handlePressOut = () => {
    scale.value = withSpring(1, { duration: 120 })
  }

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View style={[animStyle, style]}>
        {disabled ? (
          <Animated.View style={styles.disabled}>
            <Text style={styles.disabledText}>{label}</Text>
          </Animated.View>
        ) : (
          <LinearGradient
            colors={[Colors.brandOrange, Colors.brandCoral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <Text style={styles.text}>{label}</Text>
            )}
          </LinearGradient>
        )}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  gradient: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    letterSpacing: 0.16,
    color: Colors.background,
  },
  disabled: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  disabledText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkDisabled,
  },
})

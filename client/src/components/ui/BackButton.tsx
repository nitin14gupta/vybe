import { Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, ComponentSize, Radius, Spacing } from '@/constants'

interface Props {
  onPress: () => void
  transparent?: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function BackButton({ onPress, transparent = false }: Props) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.btn, transparent && styles.transparentBtn, pressStyle]}
      onPressIn={() => { pressScale.value = withSpring(0.9, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
      hitSlop={8}
    >
      <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: ComponentSize.backBtn,
    height: ComponentSize.backBtn,
    borderRadius: Radius.pill,
    // backgroundColor: Colors.surface,
    // borderWidth: 1,
    // borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: 4,
    marginLeft: Spacing.screenPadding,
  },
  transparentBtn: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
})

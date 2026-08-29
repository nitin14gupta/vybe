import { memo } from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'

interface Props {
  label: string
  emoji: string
  selected: boolean
  onPress: () => void
  bordered?: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function InterestChipBase({ label, emoji, selected, bordered, onPress }: Props) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      onPress={() => { hSelection(); onPress() }}
      onPressIn={() => { pressScale.value = withSpring(0.95, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
      style={[
        styles.chip,
        selected ? styles.selected : styles.unselected,
        bordered && styles.bordered,
        bordered && selected && styles.borderedSelected,
        pressStyle,
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected ? styles.selectedText : styles.unselectedText]}>
        {label}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  selected: {
    backgroundColor: withOpacity(Colors.inkPrimary, 0.12),
  },
  unselected: {
    backgroundColor: Colors.elevated,
  },
  bordered: {
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  borderedSelected: {
    borderColor: Colors.inkPrimary,
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
  },
  selectedText: {
    color: Colors.inkPrimary,
  },
  unselectedText: {
    color: Colors.inkSecondary,
  },
})

export const InterestChip = memo(InterestChipBase)

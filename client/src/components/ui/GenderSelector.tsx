import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'

const OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const
type Gender = typeof OPTIONS[number]

interface Props {
  value: string
  onChange: (value: string) => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function GenderOption({ option, selected, onPress }: { option: string; selected: boolean; onPress: () => void }) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { pressScale.value = withSpring(0.95, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
      style={[styles.btn, selected ? styles.selected : styles.unselected, pressStyle]}
    >
      <Text style={[styles.label, selected ? styles.selectedText : styles.unselectedText]}>
        {option}
      </Text>
    </AnimatedPressable>
  )
}

export function GenderSelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map(option => (
        <GenderOption
          key={option}
          option={option}
          selected={value === option}
          onPress={() => { hSelection(); onChange(option) }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  btn: {
    width: '48%',
    height: 48,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: withOpacity(Colors.inkPrimary, 0.12),
    borderColor: Colors.inkPrimary,
  },
  unselected: {
    backgroundColor: Colors.elevated,
    borderColor: Colors.divider,
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

import { Pressable, Text, StyleSheet } from 'react-native'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Radius } from '@/constants'

interface Props {
  label: string
  emoji: string
  selected: boolean
  onPress: () => void
  bordered?: boolean
}

export function InterestChip({ label, emoji, selected, bordered, onPress }: Props) {
  return (
    <Pressable
      onPress={() => { hSelection(); onPress() }}
      style={[
        styles.chip,
        selected ? styles.selected : styles.unselected,
        bordered && styles.bordered,
        bordered && selected && styles.borderedSelected,
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected ? styles.selectedText : styles.unselectedText]}>
        {label}
      </Text>
    </Pressable>
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
    backgroundColor: 'rgba(255,107,53,0.15)',
  },
  unselected: {
    backgroundColor: Colors.elevated,
  },
  bordered: {
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  borderedSelected: {
    borderColor: Colors.brandOrange,
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
  },
  selectedText: {
    color: Colors.brandOrange,
  },
  unselectedText: {
    color: Colors.inkSecondary,
  },
})

import { Pressable, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily, Radius } from '@/constants'

interface Props {
  label: string
  emoji: string
  selected: boolean
  onPress: () => void
}

export function InterestChip({ label, emoji, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
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
    height: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    gap: 6,
  },
  selected: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: Colors.brandOrange,
  },
  unselected: {
    backgroundColor: Colors.elevated,
    borderColor: Colors.divider,
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

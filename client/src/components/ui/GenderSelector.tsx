import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors, FontFamily, Radius } from '@/constants'

const OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const
type Gender = typeof OPTIONS[number]

interface Props {
  value: string
  onChange: (value: string) => void
}

export function GenderSelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map(option => {
        const selected = value === option
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.btn, selected ? styles.selected : styles.unselected]}
          >
            <Text style={[styles.label, selected ? styles.selectedText : styles.unselectedText]}>
              {option}
            </Text>
          </Pressable>
        )
      })}
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
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderColor: Colors.brandOrange,
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
    color: Colors.brandOrange,
  },
  unselectedText: {
    color: Colors.inkSecondary,
  },
})

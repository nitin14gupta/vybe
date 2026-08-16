import { View, Text, StyleSheet, Pressable } from 'react-native'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'

interface Props {
  availableBadges: string[]
  selectedBadges: string[]
  onToggle: (badge: string) => void
}

export function ProfileBadgeSelector({ availableBadges, selectedBadges, onToggle }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>
        BADGES{selectedBadges.length >= 4 ? '  ·  max 4 reached' : `  ·  ${selectedBadges.length}/4`}
      </Text>
      <View style={styles.chips}>
        {availableBadges.map(badge => {
          const sel = selectedBadges.includes(badge)
          return (
            <Pressable
              key={badge}
              onPress={() => { hSelection(); onToggle(badge) }}
              style={[styles.chip, sel && styles.chipSelected]}
            >
              <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                {badge}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.elevated,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: withOpacity(Colors.accentGold, 0.12),
    borderColor: Colors.accentGold,
  },
  chipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  chipTextSelected: { color: Colors.accentGold },
})

import { View, Text, StyleSheet } from 'react-native'
import { InterestChip } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'
import type { InterestResponse } from '@/types/api'

interface Props {
  availableInterests: InterestResponse[]
  selectedInterests: string[]
  atMax: boolean
  onToggle: (name: string) => void
}

export function ProfileInterestsSection({ availableInterests, selectedInterests, atMax, onToggle }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>
        INTERESTS{atMax ? '  ·  max 4 reached' : `  ·  ${selectedInterests.length}/4`}
      </Text>
      <View style={styles.chips}>
        {availableInterests.map(({ name, emoji }) => (
          <InterestChip
            bordered
            key={name}
            label={name}
            emoji={emoji}
            selected={selectedInterests.includes(name)}
            onPress={() => onToggle(name)}
          />
        ))}
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
})

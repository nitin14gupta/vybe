import { View, StyleSheet } from 'react-native'
import { Colors, Spacing, Radius } from '@/constants'

interface Props {
  step: number
  total?: number
}

export function ProgressBar({ step, total = 5 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.segment, i < step ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 10,
    paddingBottom: Spacing.sectionGap,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: Radius.pill,
  },
  active: {
    backgroundColor: Colors.brandOrange,
  },
  inactive: {
    backgroundColor: Colors.divider,
  },
})

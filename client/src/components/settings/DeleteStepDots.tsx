import { View, StyleSheet } from 'react-native'
import { Colors } from '@/constants'

interface Props {
  current: number
  total: number
}

export function DeleteStepDots({ current, total }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i + 1 === current && styles.active]} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 28 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.divider },
  active: { width: 20, backgroundColor: Colors.brandOrange },
})

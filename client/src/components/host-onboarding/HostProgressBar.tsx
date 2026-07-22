import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

// Purpose-built for this flow — no logo row, gradient-filled segments instead
// of flat color, plus a "Step X of Y" label. Intentionally not the shared
// ProgressBar (used by the main onboarding stack) so that one is untouched.
export function HostProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={s.track}>
            {i < step && (
              <LinearGradient
                colors={[Colors.brandOrange, Colors.brandCoral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.fill}
              />
            )}
          </View>
        ))}
      </View>
      <Text style={s.label}>Step {step} of {total}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.screenPadding, paddingTop: 14 },
  row: { flexDirection: 'row', gap: 6 },
  track: { flex: 1, height: 5, borderRadius: Radius.pill, backgroundColor: Colors.divider, overflow: 'hidden' },
  fill: { flex: 1, borderRadius: Radius.pill },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginTop: 8,
  },
})

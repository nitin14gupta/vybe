import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

export function WaitlistPositionBadge({ position }: { position: number }) {
  return (
    <View style={s.wrap}>
      <View style={s.ring} />
      <LinearGradient
        colors={[Colors.brandOrange, Colors.brandCoral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.circle}
      >
        <Text style={s.num}>#{position}</Text>
      </LinearGradient>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: withOpacity(Colors.brandOrange, 0.25),
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 26,
    color: Colors.inkPrimary,
    letterSpacing: -0.5,
  },
})

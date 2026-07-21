import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '@/constants'

const HEIGHT = 220

export function HomeGradientBackdrop() {
  return (
    <LinearGradient
      colors={[Colors.brandCoral, Colors.brandOrange, Colors.background]}
      locations={[0, 0.35, 1]}
      style={s.root}
      pointerEvents="none"
    />
  )
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: HEIGHT,
  },
})

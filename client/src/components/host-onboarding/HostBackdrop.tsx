import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

// A quiet top-glow instead of the animated plasma blobs used in the main
// onboarding flow — depth without the motion/noise.
export function HostBackdrop() {
  return (
    <LinearGradient
      colors={['rgba(255,107,53,0.14)', 'rgba(255,56,100,0.04)', 'transparent']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.55 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  )
}

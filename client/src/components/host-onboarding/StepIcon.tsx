import type { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

// Two-layer glow badge (soft outer halo + gradient-tinted inner circle)
// instead of a flat single-tone circle — reads as considerably more premium
// for basically the same amount of code.
export function StepIcon({ children }: { children: ReactNode }) {
  return (
    <View style={s.outer}>
      <LinearGradient
        colors={['rgba(255,107,53,0.24)', 'rgba(255,56,100,0.08)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={s.inner}
      >
        {children}
      </LinearGradient>
    </View>
  )
}

const s = StyleSheet.create({
  outer: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,107,53,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

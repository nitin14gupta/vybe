import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, Spacing } from '@/constants'

export function WaitlistPositionBadge({ position }: { position: number }) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.ring, { transform: [{ scale: pulse }] }]} />
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
    borderColor: 'rgba(255,107,53,0.25)',
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
    color: '#fff',
    letterSpacing: -0.5,
  },
})

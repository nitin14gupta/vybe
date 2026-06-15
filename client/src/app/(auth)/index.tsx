import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Screen } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'

export default function SplashScreen() {
  const opacity = useSharedValue(0)
  const taglineOpacity = useSharedValue(0)
  const dot0 = useSharedValue(0.3)
  const dot1 = useSharedValue(0.3)
  const dot2 = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 })
    taglineOpacity.value = withDelay(300, withTiming(1, { duration: 500 }))

    const pulse = (sv: Animated.SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 450 }),
            withTiming(0.3, { duration: 450 }),
          ),
          -1,
          false,
        ),
      )
    }
    pulse(dot0, 0)
    pulse(dot1, 220)
    pulse(dot2, 440)

    const timer = setTimeout(() => router.replace('/(auth)/welcome'), 2200)
    return () => clearTimeout(timer)
  }, [])

  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }))
  const d0Style = useAnimatedStyle(() => ({ opacity: dot0.value }))
  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value }))
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value }))

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={styles.glow} />
      <View style={styles.center}>
        <Animated.View style={wordmarkStyle}>
          <LinearGradient
            colors={[Colors.brandOrange, Colors.brandCoral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientMask}
          >
            <Text style={styles.wordmark}>VYBE</Text>
          </LinearGradient>
        </Animated.View>
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Meet. Vibe. Connect.
        </Animated.Text>
      </View>
      <View style={styles.dots}>
        {[d0Style, d1Style, d2Style].map((style, i) => (
          <Animated.View key={i} style={[styles.dot, style]} />
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,107,53,0.12)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -170 }, { translateY: -220 }],
  },
  center: {
    alignItems: 'center',
    zIndex: 1,
  },
  gradientMask: {
    borderRadius: 4,
  },
  wordmark: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 72,
    letterSpacing: -2.16,
    lineHeight: 72,
    color: Colors.inkPrimary,
  },
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkSecondary,
    marginTop: 14,
    letterSpacing: 0.64,
  },
  dots: {
    position: 'absolute',
    bottom: 52,
    flexDirection: 'row',
    gap: 10,
    zIndex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandOrange,
  },
})

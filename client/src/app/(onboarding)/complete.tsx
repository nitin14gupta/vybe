import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { ConfettiRain, PrimaryButton, Screen, LogoMark } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'
import { Colors, FontFamily, withOpacity } from '@/constants'

export default function CompleteScreen() {
  const store = useOnboardingStore()
  const setProfileComplete = useAuthStore(s => s.setProfileComplete)

  const scale  = useSharedValue(0)
  const fadeIn = useSharedValue(0)

  useEffect(() => {
    // A gentle settle, not a bouncy overshoot — high damping keeps it from
    // wobbling past its final size.
    scale.value  = withDelay(200, withSpring(1, { damping: 18, stiffness: 120, overshootClamping: true }))
    fadeIn.value = withDelay(400, withTiming(1, { duration: 500 }))
  }, [])

  const navigate = () => {
    setProfileComplete(true)
    store.reset()
    router.replace('/(tabs)')
  }

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: (1 - fadeIn.value) * 20 }],
  }))

  const firstName = store.name.split(' ')[0] || 'there'

  return (
    <Screen style={styles.root}>
      <ConfettiRain />

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.logoGlow, circleStyle]}>
          <View style={styles.logoCircle}>
            <LogoMark size={48} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textBlock, contentStyle]}>
          <Text style={styles.title}>You're all set,{'\n'}{firstName}!</Text>
          <Text style={styles.subtitle}>
            Start discovering events and people near you.
          </Text>
          <View style={styles.btnWrap}>
            <PrimaryButton label="Explore Gorave" onPress={navigate} />
          </View>
        </Animated.View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  logoGlow: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: withOpacity(Colors.brandOrange, 0.10),
    shadowColor: Colors.brandOrange,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: withOpacity(Colors.brandOrange, 0.13),
    borderWidth: 2,
    borderColor: withOpacity(Colors.brandOrange, 0.3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', width: '100%' },
  title: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    lineHeight: 24,
    marginBottom: 48,
    textAlign: 'center',
  },
  btnWrap: { width: '100%' },
})

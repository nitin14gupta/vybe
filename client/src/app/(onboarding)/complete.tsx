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
import { Check } from 'lucide-react-native'
import { CannonConfetti } from 'react-native-fast-confetti'
import { PrimaryButton, Screen } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'
import { Colors, FontFamily } from '@/constants'

export default function CompleteScreen() {
  const store = useOnboardingStore()
  const setProfileComplete = useAuthStore(s => s.setProfileComplete)

  const scale  = useSharedValue(0)
  const fadeIn = useSharedValue(0)

  useEffect(() => {
    scale.value  = withDelay(200, withSpring(1, { damping: 12, stiffness: 140 }))
    fadeIn.value = withDelay(400, withTiming(1, { duration: 500 }))

    const timer = setTimeout(navigate, 5000)
    return () => clearTimeout(timer)
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
      {/* Cannon confetti from both bottom corners */}
      <CannonConfetti
        autoplay
        gravity={3}
        colors={['#FF6B35', '#FF3864', '#FFB830', '#00C48C', '#F5F0EB', '#FF6B35']}
      >
        <CannonConfetti.Origin position="bottom-left" count={160} initialSpeed={3.2}>
          <CannonConfetti.Flake size={11} radius={6} />
          <CannonConfetti.Flake width={8} height={15} radius={3} />
          <CannonConfetti.Flake size={8} />
        </CannonConfetti.Origin>
        <CannonConfetti.Origin position="bottom-right" count={160} initialSpeed={3.2}>
          <CannonConfetti.Flake size={11} radius={6} />
          <CannonConfetti.Flake width={8} height={15} />
          <CannonConfetti.Flake size={8} radius={8} />
        </CannonConfetti.Origin>
      </CannonConfetti>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, circleStyle]}>
          <Check size={44} color={Colors.brandOrange} strokeWidth={2.5} />
        </Animated.View>

        <Animated.View style={[styles.textBlock, contentStyle]}>
          <Text style={styles.title}>You're all set,{'\n'}{firstName}! 🔥</Text>
          <Text style={styles.subtitle}>
            Start discovering events and people near you.
          </Text>
          <View style={styles.btnWrap}>
            <PrimaryButton label="Explore VYBE" onPress={navigate} />
          </View>
          <Text style={styles.auto}>Taking you in automatically…</Text>
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
  checkCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,107,53,0.13)',
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  textBlock: { alignItems: 'center', width: '100%' },
  title: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    lineHeight: 36,
    marginBottom: 14,
    textAlign: 'center',
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
  auto: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginTop: 18,
    textAlign: 'center',
  },
})

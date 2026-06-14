import { useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { Check } from 'lucide-react-native'
import { PrimaryButton } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const { width, height } = Dimensions.get('window')

const BRAND_COLORS = [
  Colors.brandOrange, Colors.brandCoral, Colors.accentGold,
  Colors.accentGreen, Colors.inkPrimary,
]

function ConfettiPiece({ index }: { index: number }) {
  const seed = (n: number) => Math.abs(Math.sin(index * 127.1 + n * 311.7) * 43758.5453) % 1
  const x = seed(0) * width
  const delay = seed(1) * 1800
  const dur = 2200 + seed(2) * 1600
  const color = BRAND_COLORS[Math.floor(seed(3) * BRAND_COLORS.length)]
  const size = 7 + seed(4) * 9
  const round = seed(5) > 0.5

  const translateY = useSharedValue(-16)
  const opacity = useSharedValue(1)

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(height + 20, { duration: dur }))
    opacity.value = withDelay(delay + dur * 0.7, withTiming(0, { duration: dur * 0.3 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: x,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: round ? size / 2 : 3,
        },
        style,
      ]}
    />
  )
}

export default function CompleteScreen() {
  const store = useOnboardingStore()
  const setProfileComplete = useAuthStore(s => s.setProfileComplete)
  const pieces = useMemo(() => Array.from({ length: 32 }, (_, i) => i), [])

  useEffect(() => {
    const timer = setTimeout(() => navigate(), 4000)
    return () => clearTimeout(timer)
  }, [])

  const navigate = () => {
    setProfileComplete(true)
    store.reset()
    router.replace('/(tabs)/')
  }

  const firstName = store.name.split(' ')[0] || 'there'

  return (
    <View style={styles.container}>
      {pieces.map(i => <ConfettiPiece key={i} index={i} />)}
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Check size={44} color={Colors.brandOrange} strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>You're all set, {firstName}! 🎉</Text>
        <Text style={styles.subtitle}>
          Start discovering events and people near you.
        </Text>
        <View style={styles.btnWrap}>
          <PrimaryButton label="Explore VYBE" onPress={navigate} />
        </View>
        <Text style={styles.auto}>Taking you in automatically…</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,107,53,0.14)',
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 28,
    letterSpacing: -0.56,
    color: Colors.inkPrimary,
    lineHeight: 34,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    lineHeight: 24,
    marginBottom: 44,
    textAlign: 'center',
  },
  btnWrap: { width: '100%' },
  auto: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginTop: 16,
    textAlign: 'center',
  },
})

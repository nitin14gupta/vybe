import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { Users, Calendar, MapPin, Ticket } from 'lucide-react-native'
import { PrimaryButton, Screen, LogoMark, GlowLinesBackground } from '@/components/ui'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'

const pillIconColor = Colors.inkPrimary

interface Props {
  name: string
  onExplore: () => void
  exploreLabel?: string
}

// The onboarding finish screen shown at (onboarding)/complete.tsx.
export function OnboardingCompleteView({ name, onExplore, exploreLabel = 'Explore Gorave' }: Props) {
  const scale  = useSharedValue(0)
  const fadeIn = useSharedValue(0)

  useEffect(() => {
    // A gentle settle, not a bouncy overshoot — high damping keeps it from
    // wobbling past its final size.
    scale.value  = withDelay(200, withSpring(1, { damping: 18, stiffness: 120, overshootClamping: true }))
    fadeIn.value = withDelay(400, withTiming(1, { duration: 500 }))
  }, [])

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: (1 - fadeIn.value) * 20 }],
  }))

  const firstName = name.split(' ')[0] || 'there'

  return (
    <View style={styles.rootWrap}>
      <GlowLinesBackground />

      <Screen style={styles.root} transparent>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={[styles.pill, styles.pillPeople]}>
              <Users size={14} color={pillIconColor} strokeWidth={2} />
              <Text style={styles.pillText}>People</Text>
            </View>
            <View style={[styles.pill, styles.pillEvents]}>
              <Calendar size={14} color={pillIconColor} strokeWidth={2} />
              <Text style={styles.pillText}>Events</Text>
            </View>
            <View style={[styles.pill, styles.pillNearby]}>
              <MapPin size={14} color={pillIconColor} strokeWidth={2} />
              <Text style={styles.pillText}>Nearby</Text>
            </View>
            <View style={[styles.pill, styles.pillExperiences]}>
              <Ticket size={14} color={pillIconColor} strokeWidth={2} />
              <Text style={styles.pillText}>Experiences</Text>
            </View>

            <Animated.View style={[styles.logoGlow, circleStyle]}>
              <View style={styles.logoCircle}>
                <LogoMark size={48} />
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.textBlock, contentStyle]}>
            <Text style={styles.title}>You're all set,{'\n'}{firstName}!</Text>
            <Text style={styles.subtitle}>
              Start discovering events and people near you.
            </Text>
            <View style={styles.btnWrap}>
              <PrimaryButton label={exploreLabel} onPress={onExplore} />
            </View>
          </Animated.View>
        </View>
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  rootWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  hero: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: withOpacity(Colors.white, 0.06),
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.1),
  },
  pillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkPrimary,
  },
  pillPeople: { top: 0, left: 0 },
  pillEvents: { top: 44, right: 0 },
  pillNearby: { bottom: 44, left: 0 },
  pillExperiences: { bottom: 0, right: 0 },
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

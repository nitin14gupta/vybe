import { useEffect } from 'react'
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton, TextLinkButton, Screen, LogoMark } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const { height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const cardY = useSharedValue(40)
  const cardOpacity = useSharedValue(0)

  useEffect(() => {
    cardY.value = withDelay(80, withTiming(0, { duration: 400 }))
    cardOpacity.value = withDelay(80, withTiming(1, { duration: 400 }))
  }, [])

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }))

  return (
    <Screen top={false}>
      {/* City illustration area — full-bleed image */}
      <View style={styles.cityArea}>
        <Image
          source={require('../../../assets/images/onboarding/welcome.png')}
          style={styles.cityImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', Colors.background]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.brandRow, { top: insets.top + 12 }]}>
          <LogoMark size={22} />
          <Text style={styles.brandText}>VYBE</Text>
        </View>
      </View>

      {/* Bottom card */}
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.heading}>Find your vibe</Text>
        <Text style={styles.subheading}>
          House parties, events &amp; real connections — all in one place
        </Text>
        <PrimaryButton
          label="Get Started"
          onPress={() => router.push('/(auth)/phone')}
          style={styles.btn}
        />
        <TextLinkButton
          label="I already have an account"
          onPress={() => router.push('/(auth)/phone')}
          style={styles.link}
        />
        <View style={styles.dots}>
          {[true, false, false].map((active, i) => (
            <View
              key={i}
              style={[styles.pageDot, active ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  cityArea: {
    height: height * 0.48,
    overflow: 'hidden',
  },
  cityImage: {
    width: '100%',
    height: '100%',
  },
  brandRow: {
    position: 'absolute',
    left: Spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    letterSpacing: 1,
    color: '#fff',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 28,
  },
  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    letterSpacing: -0.64,
    color: Colors.inkPrimary,
    marginBottom: 10,
    lineHeight: 38,
  },
  subheading: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  btn: {
    marginBottom: 10,
  },
  link: {
    alignSelf: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  pageDot: {
    height: 8,
    borderRadius: Radius.pill,
  },
  activeDot: {
    width: 22,
    backgroundColor: Colors.brandOrange,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Colors.elevated,
  },
})

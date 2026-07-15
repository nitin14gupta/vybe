import { useEffect } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated'
import { Logo } from '@/constants'

// App-launch splash — full black, centered logo with a soft glow, and a
// slim indeterminate loading bar underneath. Both animate continuously
// ("breathing" logo, sliding bar) for as long as this stays mounted, so
// whatever navigates away from it can wait on real async work (auth check,
// initial data fetch, etc.) without the screen ever looking frozen.
export function SplashScreen() {
  const scale = useSharedValue(1)
  const barX = useSharedValue(0)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
    barX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: barX.value * (LOADER_WIDTH - LOADER_BAR_WIDTH) }],
  }))

  return (
    <View style={s.root}>
      <View style={s.stack}>
        <Animated.View style={[s.logoGlow, logoStyle]}>
          <Image source={Logo} style={s.logo} resizeMode="contain" />
        </Animated.View>
      </View>

      <View style={s.loaderTrack}>
        <Animated.View style={[s.loaderBar, barStyle]} />
      </View>
    </View>
  )
}

const LOADER_WIDTH = 88
const LOADER_BAR_WIDTH = 36

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    alignItems: 'center',
  },
  shadowOuter: {
    width: 100,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: -6,
  },
  shadowInner: {
    width: 60,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: -9,
  },
  logoGlow: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.14,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 0 },
  },
  logo: {
    width: 76,
    height: 76,
  },
  loaderTrack: {
    position: 'absolute',
    bottom: 88,
    width: LOADER_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  loaderBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: LOADER_BAR_WIDTH,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
})

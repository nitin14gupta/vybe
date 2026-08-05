import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming,
} from 'react-native-reanimated'
import { Wallet } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

const P_COLORS = ['#FF6B35', '#FF3864', '#00C48C', '#FFB830', '#FF6B35', '#00C48C', '#FF3864', '#FFB830']

function Particle({ index }: { index: number }) {
  const angle = (index / 8) * Math.PI * 2
  const dist  = 80 + (index % 3) * 20
  const pX  = useSharedValue(0)
  const pY  = useSharedValue(0)
  const pOp = useSharedValue(0)

  useEffect(() => {
    pX.value  = withDelay(80, withSpring(Math.cos(angle) * dist, { damping: 12 }))
    pY.value  = withDelay(80, withSpring(Math.sin(angle) * dist, { damping: 12 }))
    pOp.value = withDelay(80, withTiming(1, { duration: 150 }))
    setTimeout(() => { pOp.value = withTiming(0, { duration: 400 }) }, 1000)
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: pX.value }, { translateY: pY.value }],
    opacity: pOp.value,
  }))

  return <Animated.View style={[s.particle, { backgroundColor: P_COLORS[index] }, style]} />
}

export function PaymentWalletSuccessOverlay({ amount, onDone }: { amount: number; onDone: () => void }) {
  const scale   = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [])

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={s.root}>
      <View style={s.center}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <Particle key={i} index={i} />)}
        <Animated.View style={[s.circle, circleStyle]}>
          <Wallet size={36} color="#fff" strokeWidth={2} />
        </Animated.View>
        <Text style={s.label}>₹{amount} from Gorave Wallet</Text>
        <Text style={s.sub}>applied to your booking</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  center: { alignItems: 'center', justifyContent: 'center' },
  circle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  label: { fontFamily: FontFamily.headingBold, fontSize: 22, color: '#fff', textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  particle: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
})

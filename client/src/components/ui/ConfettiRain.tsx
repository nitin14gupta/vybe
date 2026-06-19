import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, View } from 'react-native'

const COLORS = ['#FF6B35', '#FF3864', '#FFB59D', '#FFBA3A', '#CF0346']
const { width: W, height: H } = Dimensions.get('window')
const COUNT = 32

export function ConfettiRain() {
  const pieces = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      key: String(i),
      fall: new Animated.Value(0),
      wobble: new Animated.Value(0),
      spin: new Animated.Value(0),
      color: COLORS[i % COLORS.length],
      size: 5 + (i % 7),
      isCircle: i % 4 === 0,
      left: (W / COUNT) * i + (i % 11) * 4,
      maxDrift: (i % 2 === 0 ? 1 : -1) * (18 + i % 22),
      duration: 2300 + (i % 5) * 380,
    }))
  ).current

  useEffect(() => {
    const handles: ReturnType<typeof setTimeout>[] = []
    const anims: Animated.CompositeAnimation[] = []

    pieces.forEach((p, i) => {
      const t = setTimeout(() => {
        const a = Animated.loop(
          Animated.parallel([
            Animated.timing(p.fall, { toValue: 1, duration: p.duration, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.wobble, { toValue: 1, duration: p.duration / 2, useNativeDriver: true }),
              Animated.timing(p.wobble, { toValue: 0, duration: p.duration / 2, useNativeDriver: true }),
            ]),
            Animated.timing(p.spin, { toValue: 1, duration: p.duration, useNativeDriver: true }),
          ])
        )
        anims.push(a)
        a.start()
      }, i * 60)
      handles.push(t)
    })

    return () => {
      handles.forEach(clearTimeout)
      anims.forEach(a => a.stop())
    }
  }, [])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(p => (
        <Animated.View
          key={p.key}
          style={[
            {
              position: 'absolute',
              left: p.left,
              top: 0,
              width: p.size,
              height: p.isCircle ? p.size : p.size * 1.6,
              borderRadius: p.isCircle ? p.size : 2,
              backgroundColor: p.color,
              opacity: 0.85,
            },
            {
              transform: [
                { translateY: p.fall.interpolate({ inputRange: [0, 1], outputRange: [-30, H + 40] }) },
                { translateX: p.wobble.interpolate({ inputRange: [0, 1], outputRange: [0, p.maxDrift] }) },
                { rotate: p.spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

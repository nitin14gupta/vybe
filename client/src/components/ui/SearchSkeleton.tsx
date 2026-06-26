import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing,
} from 'react-native-reanimated'

const BONE = '#2a2a2a'
const COUNT = 7

function SkeletonRow({ opacity }: { opacity: Animated.SharedValue<number> }) {
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View style={[s.row, aStyle]}>
      <View style={s.avatar} />
      <View style={s.info}>
        <View style={s.lineName} />
        <View style={s.lineUser} />
      </View>
    </Animated.View>
  )
}

export function SearchSkeleton({ count = COUNT }: { count?: number }) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [])

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} opacity={opacity} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BONE,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  lineName: {
    height: 14,
    width: '55%',
    borderRadius: 7,
    backgroundColor: BONE,
  },
  lineUser: {
    height: 12,
    width: '35%',
    borderRadius: 6,
    backgroundColor: BONE,
  },
})

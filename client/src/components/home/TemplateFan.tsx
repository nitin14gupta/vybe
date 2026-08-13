import { StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Image } from 'expo-image'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing,
  type SharedValue,
} from 'react-native-reanimated'
import { TEMPLATE_IMAGE_URIS } from '@/lib/templateImages'

const AnimatedTemplateImage = Animated.createAnimatedComponent(Image)

const TEMPLATE_IMAGES = TEMPLATE_IMAGE_URIS.map(uri => ({ uri }))

const N = TEMPLATE_IMAGES.length
const LOOPS = 3
const PHYSICAL_COUNT = N * LOOPS

const CARD_SIZE = 124
const STEP = 40
const SWIPE_THRESHOLD = STEP * 0.6
const SPIN_MS = 340
const VISIBLE_HALF = 4
const FADE_PAST = 1

function centeredMod(x: number, m: number) {
  'worklet'
  let r = ((x % m) + m) % m
  if (r > m / 2) r -= m
  return r
}

function FanCard({ p, source, center, settledCenter, onTapActive }: {
  p: number
  source: any
  center: SharedValue<number>
  settledCenter: SharedValue<number>
  onTapActive?: () => void
}) {
  const style = useAnimatedStyle(() => {
    const offset = centeredMod(p - center.value, PHYSICAL_COUNT)
    const dist = Math.abs(offset)
    const settledDist = Math.abs(centeredMod(p - settledCenter.value, PHYSICAL_COUNT))
    return {
      zIndex: Math.round(100 - settledDist),
      opacity: Math.max(0, Math.min(1, 1 - (dist - VISIBLE_HALF) / FADE_PAST)),
      transform: [
        { translateX: offset * STEP },
        { translateY: dist * dist * 3.2 },
        { rotate: `${offset * 1}deg` },
        { scale: Math.max(0.3, 1 - dist * 0.07) },
      ],
    }
  })

  // Tap the already-centered card → open Create Event. Tap any other card →
  // spin the wheel to bring it to center, no swipe required. A nested
  // GestureDetector here is fine (unlike core RN's Pressable-in-Pressable,
  // which is the thing that breaks on Android — gesture-handler is a
  // separate system built for exactly this kind of composition).
  const tap = Gesture.Tap().onEnd(() => {
    'worklet'
    const settledDist = Math.abs(centeredMod(p - settledCenter.value, PHYSICAL_COUNT))
    if (settledDist === 0) {
      if (onTapActive) runOnJS(onTapActive)()
      return
    }
    const target = center.value + centeredMod(p - center.value, PHYSICAL_COUNT)
    center.value = withTiming(target, { duration: SPIN_MS, easing: Easing.out(Easing.cubic) }, finished => {
      if (finished) settledCenter.value = target
    })
  })

  return (
    <GestureDetector gesture={tap}>
      <AnimatedTemplateImage
        source={source}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={150}
        style={[s.card, style]}
      />
    </GestureDetector>
  )
}

interface Props {
  /** Which template image starts at the center slot. */
  startIndex?: number
  /** Tapping the already-centered card fires this (e.g. open Create Event). */
  onCreatePress?: () => void
}

// Fixed fan of cards, spinnable like a real card spinner. `center` is the
// ONLY thing driving the whole wheel — purely a UI-thread value, never React
// state. There is nothing for the JS and UI threads to disagree about
// anymore, which is what the earlier prop-swapping version couldn't
// guarantee.
export function TemplateFan({ startIndex = 0, onCreatePress }: Props) {
  const center = useSharedValue(startIndex)
  const settledCenter = useSharedValue(startIndex)

  const pan = Gesture.Pan()
    .onEnd(e => {
      const distance = e.translationX + e.velocityX * 0.05
      const force = Math.abs(e.translationX) + Math.abs(e.velocityX) * 0.12
      if (force < SWIPE_THRESHOLD) return

      const extra = Math.max(0, force - SWIPE_THRESHOLD)
      const steps = 1 + Math.round(Math.log2(extra / STEP + 1) * 2)
      const direction = distance > 0 ? -1 : 1
      const duration = SPIN_MS + Math.min(steps - 1, 10) * 70

      center.value = withTiming(center.value + steps * direction, {
        duration,
        easing: Easing.out(Easing.cubic),
      }, finished => {
        if (finished) settledCenter.value = center.value
      })
    })

  const cards = Array.from({ length: PHYSICAL_COUNT }, (_, p) => p)

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={s.root}>
        {cards.map(p => (
          <FanCard key={p} p={p} center={center} settledCenter={settledCenter} source={TEMPLATE_IMAGES[p % N]} onTapActive={onCreatePress} />
        ))}
      </Animated.View>
    </GestureDetector>
  )
}

const s = StyleSheet.create({
  root: {
    height: CARD_SIZE + 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
})

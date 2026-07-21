import { StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
  type SharedValue,
} from 'react-native-reanimated'

// 7 template images.
const TEMPLATE_IMAGES = [
  require('../../../assets/images/templates/beack.webp'),
  require('../../../assets/images/templates/christmas.webp'),
  require('../../../assets/images/templates/halloween.webp'),
  require('../../../assets/images/templates/houseparty.webp'),
  require('../../../assets/images/templates/nightout.webp'),
  require('../../../assets/images/templates/retro.webp'),
  require('../../../assets/images/templates/wooden.webp'),
]

const N = TEMPLATE_IMAGES.length
// 3 full loops = 21 physical cards. Only ~9 are ever visible at once — the
// rest sit off in the wrapped-around background as a reservoir, so a user
// can spin the same direction many times in a row before the wraparound
// (which is mathematically seamless anyway — see centeredMod) is even
// something that could happen mid-view.
const LOOPS = 3
const PHYSICAL_COUNT = N * LOOPS

const CARD_SIZE = 100
const STEP = 50
const SWIPE_THRESHOLD = STEP * 0.6
const SPIN_MS = 340
const VISIBLE_HALF = 4
const FADE_PAST = 1

// Wraps x into the range (-m/2, m/2] — e.g. centeredMod(19, 21) = -2, not 19.
// This is the whole trick: each physical card p has a PERMANENTLY FIXED
// image (TEMPLATE_IMAGES[p % N], assigned once, never swapped as a prop —
// that swap was the source of the flash in the previous version). Spinning
// only ever changes `center` (a shared value). A card's on-screen offset is
// centeredMod(p - center, PHYSICAL_COUNT) — as center increases past
// PHYSICAL_COUNT, this wraps the card's rendered position back around to
// the other side. Because PHYSICAL_COUNT is a multiple of N, wrapping a
// card by PHYSICAL_COUNT slots always lands it on a card showing the SAME
// image sequence, so the wrap is invisible even in principle — there's no
// "reassign the image" step left to race against anything.
function centeredMod(x: number, m: number) {
  'worklet'
  let r = ((x % m) + m) % m
  if (r > m / 2) r -= m
  return r
}

function FanCard({ p, source, center }: {
  p: number
  source: any
  center: SharedValue<number>
}) {
  const style = useAnimatedStyle(() => {
    const offset = centeredMod(p - center.value, PHYSICAL_COUNT)
    const dist = Math.abs(offset)
    return {
      zIndex: Math.round(100 - dist),
      opacity: Math.max(0, Math.min(1, 1 - (dist - VISIBLE_HALF) / FADE_PAST)),
      transform: [
        { translateX: offset * STEP },
        { translateY: dist * dist * 3.2 },
        { rotate: `${offset * 10.5}deg` },
        { scale: Math.max(0.3, 1 - dist * 0.07) },
      ],
    }
  })
  return <Animated.Image source={source} resizeMode="cover" style={[s.card, style]} />
}

interface Props {
  /** Which template image starts at the center slot. */
  startIndex?: number
}

// Fixed fan of cards, spinnable like a real card spinner. `center` is the
// ONLY thing driving the whole wheel — purely a UI-thread value, never React
// state. There is nothing for the JS and UI threads to disagree about
// anymore, which is what the earlier prop-swapping version couldn't
// guarantee.
export function TemplateFan({ startIndex = 0 }: Props) {
  const center = useSharedValue(startIndex)

  const pan = Gesture.Pan()
    .onEnd(e => {
      const distance = e.translationX + e.velocityX * 0.05
      if (Math.abs(distance) < SWIPE_THRESHOLD) return
      const steps = distance > 0 ? -1 : 1
      center.value = withTiming(center.value + steps, {
        duration: SPIN_MS,
        easing: Easing.out(Easing.cubic),
      })
    })

  const cards = Array.from({ length: PHYSICAL_COUNT }, (_, p) => p)

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={s.root}>
        {cards.map(p => (
          <FanCard key={p} p={p} center={center} source={TEMPLATE_IMAGES[p % N]} />
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
    borderRadius: 16,
  },
})

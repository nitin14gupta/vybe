import { Animated, Platform } from 'react-native'

// Slide the bottom tab bar away on scroll-down, back on scroll-up. Android
// only for now — the tab bar's own translateY sits at 0 forever on iOS since
// handleTabBarScroll no-ops there.
export const tabBarTranslateY = new Animated.Value(0)

const HIDE_DISTANCE = 140 // clears the tab bar (72) + the tallest safe-area inset with room to spare
const SCROLL_THRESHOLD = 8 // ignore sub-pixel jitter from rubber-banding

let lastOffset = 0
let hidden = false

function animateTo(toValue: number) {
  Animated.timing(tabBarTranslateY, {
    toValue,
    duration: 220,
    useNativeDriver: true,
  }).start()
}

export function handleTabBarScroll(offsetY: number) {
  if (Platform.OS !== 'android') return

  const delta = offsetY - lastOffset
  lastOffset = offsetY

  if (offsetY <= 0) {
    if (hidden) {
      hidden = false
      animateTo(0)
    }
    return
  }

  if (delta > SCROLL_THRESHOLD && !hidden) {
    hidden = true
    animateTo(HIDE_DISTANCE)
  } else if (delta < -SCROLL_THRESHOLD && hidden) {
    hidden = false
    animateTo(0)
  }
}

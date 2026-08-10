import { useRef } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

const SCROLL_THRESHOLD = 8 // ignore sub-pixel jitter from rubber-banding

// Per-screen version of the tab-bar hide pattern (see src/lib/tabBarVisibility.ts),
// but local (each header animates independently) and on both platforms.
// Pass the returned `hideProgress` to <AppHeader hideProgress={...} />, and
// spread {...onScroll} (merging with any other onScroll, e.g. useTabBarScroll)
// onto the screen's scrollable.
export function useHeaderScroll() {
  const hideProgress = useRef(new Animated.Value(0)).current
  const lastOffset = useRef(0)
  const hidden = useRef(false)

  function animateTo(toValue: number) {
    Animated.timing(hideProgress, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    const delta = offsetY - lastOffset.current
    lastOffset.current = offsetY

    if (offsetY <= 0) {
      if (hidden.current) {
        hidden.current = false
        animateTo(0)
      }
      return
    }

    if (delta > SCROLL_THRESHOLD && !hidden.current) {
      hidden.current = true
      animateTo(1)
    } else if (delta < -SCROLL_THRESHOLD && hidden.current) {
      hidden.current = false
      animateTo(0)
    }
  }

  return { hideProgress, onScroll, scrollEventThrottle: 16 }
}

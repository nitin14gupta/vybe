import { useRef } from 'react'
import { Animated as RNAnimated } from 'react-native'
import { runOnJS, useAnimatedScrollHandler, useSharedValue, withSpring } from 'react-native-reanimated'
import { useTabBarMinimized, MINIMIZE_SPRING } from 'expo-glass-tabs'

const SCROLL_THRESHOLD = 8 // ignore sub-pixel jitter from rubber-banding

// A screen's scrollable can only own one onScroll, and the glass tab bar's
// minimize progress lives on the UI thread (expo-glass-tabs' Reanimated
// shared value), so a plain per-screen header-fade callback can't just be
// spread alongside it like the old tab bar allowed. This drives both from a
// single Reanimated scroll handler — pass `scrollHandler` to an
// Animated.ScrollView/Animated.FlatList, and `hideProgress` to
// <AppHeader hideProgress={...} />.
export function useHeaderAndTabBarScroll() {
  const hideProgress = useRef(new RNAnimated.Value(0)).current
  const headerHidden = useRef(false)
  const headerLastOffset = useRef(0)

  const minimizeProgress = useTabBarMinimized()
  const minimizeTarget = useSharedValue(0)
  const minimizeLastY = useSharedValue(0)

  const setHeaderHidden = (hidden: boolean) => {
    headerHidden.current = hidden
    RNAnimated.timing(hideProgress, { toValue: hidden ? 1 : 0, duration: 220, useNativeDriver: true }).start()
  }

  const onHeaderScroll = (offsetY: number) => {
    const delta = offsetY - headerLastOffset.current
    headerLastOffset.current = offsetY
    if (offsetY <= 0) {
      if (headerHidden.current) setHeaderHidden(false)
      return
    }
    if (delta > SCROLL_THRESHOLD && !headerHidden.current) setHeaderHidden(true)
    else if (delta < -SCROLL_THRESHOLD && headerHidden.current) setHeaderHidden(false)
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Mirrors expo-glass-tabs' internal useMinimizeOnScroll — reimplemented
      // here (rather than used directly) because it needs to share this one
      // scroll handler with the header-fade logic below.
      const maxY = Math.max(event.contentSize.height - event.layoutMeasurement.height, 0)
      const y = Math.min(Math.max(event.contentOffset.y, 0), maxY)
      const dy = y - minimizeLastY.value
      minimizeLastY.value = y

      if (y < 24) {
        if (minimizeTarget.value !== 0) {
          minimizeTarget.value = 0
          minimizeProgress.value = withSpring(0, MINIMIZE_SPRING)
        }
      } else if (dy > 3 && minimizeTarget.value !== 1) {
        minimizeTarget.value = 1
        minimizeProgress.value = withSpring(1, MINIMIZE_SPRING)
      } else if (dy < -3 && minimizeTarget.value !== 0) {
        minimizeTarget.value = 0
        minimizeProgress.value = withSpring(0, MINIMIZE_SPRING)
      }

      runOnJS(onHeaderScroll)(y)
    },
  })

  return { hideProgress, scrollHandler, scrollEventThrottle: 16 }
}

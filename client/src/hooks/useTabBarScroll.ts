import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { handleTabBarScroll } from '@/lib/tabBarVisibility'

// Spread onto a tab screen's ScrollView/FlatList to drive the auto-hiding
// bottom tab bar. See src/lib/tabBarVisibility.ts.
export function useTabBarScroll() {
  return {
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleTabBarScroll(e.nativeEvent.contentOffset.y)
    },
    scrollEventThrottle: 16,
  }
}

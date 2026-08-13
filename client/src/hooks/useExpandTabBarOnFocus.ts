import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { withSpring } from 'react-native-reanimated'
import { useTabBarMinimized, MINIMIZE_SPRING } from 'expo-glass-tabs'

export function useExpandTabBarOnFocus() {
  const progress = useTabBarMinimized()
  useFocusEffect(
    useCallback(() => {
      progress.value = withSpring(0, MINIMIZE_SPRING)
    }, [progress])
  )
}

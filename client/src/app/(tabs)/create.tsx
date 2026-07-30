import { useEffect } from 'react'
import { router } from 'expo-router'

// This file is intentionally a placeholder. Create tab behavior is
// intercepted in (tabs)/_layout.tsx (tabBarButton opens CreateEventSheet
// instead of navigating here) so this route never actually renders.
export default function CreateTabPlaceholder() {
  useEffect(() => {
    router.replace('/(tabs)/')
  }, [])
  return null
}

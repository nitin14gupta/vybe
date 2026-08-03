import { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'

interface RefreshTarget {
  loaded: boolean
  fetchFirstPage: (isRefresh?: boolean) => void
}

// Revalidates already-loaded data when the screen regains real navigation
// focus (left the screen and came back) — not on in-screen state changes
// like swiping between tabs. Same idea as "refetch on window focus" in
// React Query: once data is cached, swiping back and forth between tabs
// should be instant, no network call — pull-to-refresh already covers the
// manual case, this only covers "did this go stale while I was away."
//
// `getTarget` is read through a ref so callers can pass a fresh closure
// every render without re-subscribing the focus listener each time.
export function useFocusRefresh(getTarget: () => RefreshTarget | null | undefined) {
  const getTargetRef = useRef(getTarget)
  getTargetRef.current = getTarget

  useFocusEffect(
    useCallback(() => {
      const target = getTargetRef.current()
      if (target?.loaded) target.fetchFirstPage(false)
    }, []),
  )
}

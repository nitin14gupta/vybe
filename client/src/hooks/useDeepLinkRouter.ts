import { useEffect, useRef } from 'react'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useDeepLinkStore } from '@/store/deepLinkStore'
import { DeepLinkTarget, targetToHref, parseIncomingUrl } from '@/lib/deepLink'

// Shared by this hook (externally-opened links) and useNotificationSetup (push
// taps): navigate immediately if the destination is reachable under the root
// layout's Stack.Protected guards, otherwise queue it to replay once the user
// finishes login/onboarding.
export function navigateToTarget(target: DeepLinkTarget) {
  const { isAuthenticated, profileComplete, userId } = useAuthStore.getState()
  if (isAuthenticated && profileComplete) {
    router.push(targetToHref(target, userId) as any)
  } else {
    useDeepLinkStore.getState().setPending(target)
  }
}

export function useDeepLinkRouter() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const profileComplete = useAuthStore(s => s.profileComplete)
  const userId = useAuthStore(s => s.userId)
  const pendingTarget = useDeepLinkStore(s => s.pendingTarget)
  const clearPending = useDeepLinkStore(s => s.clearPending)
  const handledInitialUrl = useRef(false)

  // Cold start — app was launched by tapping a link
  useEffect(() => {
    if (handledInitialUrl.current) return
    handledInitialUrl.current = true
    Linking.getInitialURL().then(url => {
      if (!url) return
      const target = parseIncomingUrl(url)
      if (target) navigateToTarget(target)
    })
  }, [])

  // Warm start — app already running when the link is opened
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const target = parseIncomingUrl(url)
      if (target) navigateToTarget(target)
    })
    return () => sub.remove()
  }, [])

  // Replay a queued target the moment the Stack.Protected guards let it through.
  // The short delay lets the newly-mounted screen group exist before we push —
  // otherwise the guard swap and this push can race.
  useEffect(() => {
    if (!pendingTarget || !isAuthenticated || !profileComplete) return
    const timer = setTimeout(() => {
      router.push(targetToHref(pendingTarget, userId) as any)
      clearPending()
    }, 0)
    return () => clearTimeout(timer)
  }, [pendingTarget, isAuthenticated, profileComplete, userId, clearPending])
}

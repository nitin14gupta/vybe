import { useRouter } from 'expo-router'

/**
 * Safe back navigation. Falls back to the main tabs root if there is
 * no previous screen in the stack (e.g. deep link, router.replace entry point).
 */
export function useGoBack(fallback: string = '/(tabs)') {
  const router = useRouter()
  return () => {
    if (router.canGoBack()) router.back()
    else router.replace(fallback as any)
  }
}

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/** Syncs a Radix Tabs `value` with a `?tab=` query param, so a tab can be deep-linked/shared/reloaded onto. */
export function useTabParam(defaultValue: string): [string, (value: string) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const value = searchParams.get('tab') ?? defaultValue

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return [value, setValue]
}

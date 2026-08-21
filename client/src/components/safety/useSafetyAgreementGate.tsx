import { useRef, useState } from 'react'
import { SafetyAgreementSheet } from './SafetyAgreementSheet'
import { useSafetyAgreement } from '@/hooks/useSafetyAgreement'
import { useSafetyAgreementStore } from '@/store/safetyAgreementStore'

// Gates a first-time action (an attendee's first RSVP, a host's first
// published event) behind the Community Safety Agreement. `runGated` either
// runs the action immediately (already accepted) or opens the agreement and
// runs it the moment they agree — the original tap always carries through,
// it just may have one extra step in between the very first time.
export function useSafetyAgreementGate() {
  // Keeps useSafetyAgreement's self-triggered check() running in the
  // background. runGated below reads the store imperatively (getState())
  // rather than this hook's own render-time values, since a check() that's
  // still in flight when someone taps the gated action would otherwise be
  // decided on a stale closure.
  const { check, accept } = useSafetyAgreement()
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<(() => void) | null>(null)

  const runGated = async (action: () => void) => {
    if (!useSafetyAgreementStore.getState().loaded) {
      await check()
    }
    if (useSafetyAgreementStore.getState().accepted) {
      action()
      return
    }
    pendingRef.current = action
    setOpen(true)
  }

  const handleAgree = async (): Promise<boolean> => {
    const ok = await accept()
    if (ok) {
      pendingRef.current?.()
      pendingRef.current = null
    }
    return ok
  }

  const sheet = (
    <SafetyAgreementSheet
      visible={open}
      onAgree={handleAgree}
      onClose={() => { setOpen(false); pendingRef.current = null }}
    />
  )

  return { runGated, sheet }
}

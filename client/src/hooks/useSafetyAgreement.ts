import { useCallback, useEffect } from 'react'
import ApiService from '@/api/apiService'
import { useSafetyAgreementStore } from '@/store/safetyAgreementStore'

let inFlightCheck: Promise<void> | null = null

export function useSafetyAgreement() {
  const accepted = useSafetyAgreementStore(s => s.accepted)
  const loaded = useSafetyAgreementStore(s => s.loaded)
  const setAccepted = useSafetyAgreementStore(s => s.setAccepted)

  const check = useCallback(async () => {
    if (inFlightCheck) return inFlightCheck
    inFlightCheck = (async () => {
      try {
        const me = await ApiService.getMe()
        setAccepted(!!me.safety_agreement_accepted_at)
      } catch {
        // leave unresolved — see note above
      } finally {
        inFlightCheck = null
      }
    })()
    return inFlightCheck
  }, [setAccepted])

  useEffect(() => {
    if (!loaded) check()
  }, [loaded, check])

  const accept = useCallback(async (): Promise<boolean> => {
    try {
      await ApiService.acceptSafetyAgreement()
      setAccepted(true)
      return true
    } catch {
      return false
    }
  }, [setAccepted])

  return { accepted, loaded, check, accept }
}

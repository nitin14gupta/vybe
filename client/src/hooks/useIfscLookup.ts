import { useEffect, useState } from 'react'

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/

export interface BankInfo {
  bank: string
  branch: string
}

// The bank + branch are fully determined by the IFSC code — no need to make
// a host type them in. Razorpay's public IFSC lookup is free, unauthenticated.
export function useIfscLookup(ifscCode: string) {
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const validFormat = IFSC_REGEX.test(ifscCode)

  useEffect(() => {
    setBankInfo(null)
    setError(false)
    if (!validFormat) return

    let cancelled = false
    setLoading(true)
    fetch(`https://ifsc.razorpay.com/${ifscCode}`)
      .then(res => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then(data => { if (!cancelled) setBankInfo({ bank: data.BANK, branch: data.BRANCH }) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [ifscCode, validFormat])

  return { validFormat, loading, bankInfo, error }
}

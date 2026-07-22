import { useEffect, useRef, useState } from 'react'
import RazorpayCustomUI from 'react-native-customui'

export interface VpaResult {
  name: string
  vpa: string
}

const VPA_FORMAT_REGEX = /^[\w.\-]+@[\w]+$/

export function useVpaValidation(vpa: string, rzpKey: string) {
  const [vpaResult, setVpaResult] = useState<VpaResult | null>(null)
  const [vpaError, setVpaError] = useState(false)
  const [checking, setChecking] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  const validFormat = VPA_FORMAT_REGEX.test(vpa.trim())

  useEffect(() => {
    if (rzpKey && !initializedRef.current) {
      RazorpayCustomUI.initRazorpay(rzpKey)
      initializedRef.current = true
    }
  }, [rzpKey])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setVpaResult(null)
    setVpaError(false)
    if (!validFormat) return
    debounceRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const res: any = await RazorpayCustomUI.isValidVpa(vpa.trim())
        if (res?.customer_name || res?.name) {
          setVpaResult({ name: res.customer_name ?? res.name, vpa: vpa.trim() })
        } else {
          setVpaError(true)
        }
      } catch {
        setVpaError(true)
      } finally {
        setChecking(false)
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [vpa, validFormat])

  return { validFormat, checking, vpaResult, vpaError }
}

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { loadOrCreateKeypair } from '@/lib/e2ee'
import ApiService from '@/api/apiService'
import { encodeBase64 } from 'tweetnacl-util'

/** Loads (or generates) this device's E2EE keypair once authenticated, and
 * makes sure the server has our current public key on file. Idempotent —
 * safe to call on every app start. */
export function useE2EESetup() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    ;(async () => {
      try {
        const kp = await loadOrCreateKeypair()
        await ApiService.setPublicKey(encodeBase64(kp.publicKey))
      } catch (err) {
        console.warn('[e2ee] keypair setup failed:', err)
      }
    })()
  }, [isAuthenticated])
}

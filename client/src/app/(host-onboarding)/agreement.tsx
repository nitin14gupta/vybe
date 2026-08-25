import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { AppHeader, HeaderIconBtn, PrimaryButton, KeyboardAvoidingWrapper } from '@/components/ui'
import { HostAgreementStep } from '@/components/host-onboarding'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { setCached } from '@/lib/queryCache'
import { CacheKeys, Colors, Spacing } from '@/constants'

// Catch-up screen for hosts who finished onboarding before the Host
// Agreement existed — create.tsx redirects here whenever
// host_agreement_accepted_at is missing, regardless of how long ago they
// onboarded. New hosts sign as step 4 of the onboarding wizard instead (see
// (host-onboarding)/index.tsx); this route exists so existing hosts aren't
// permanently grandfathered out of signing it.
export default function HostAgreementCatchUpScreen() {
  const showPill = usePillStore(s => s.show)
  const setStoredSignatureUri = useSignatureCaptureStore(s => s.setUri)
  const [signatureUri, setSignatureUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset the captured-signature store on entry so a signature left over
  // from a previous, abandoned visit to this flow doesn't show as already
  // signed.
  useEffect(() => {
    setStoredSignatureUri(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContinue = async () => {
    if (!signatureUri || saving) return
    setSaving(true)
    try {
      const signatureUrl = await ApiService.uploadSignature(signatureUri)
      const updatedProfile = await ApiService.acceptHostAgreement(signatureUrl)
      setCached(CacheKeys.profile(), updatedProfile)
      setStoredSignatureUri(null)
      hTap()
      router.replace('/(events)/create')
    } catch (err: any) {
      showPill(err?.message ?? 'Could not save your signature. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="Host Agreement"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <KeyboardAvoidingWrapper>
        <View style={s.content}>
          <HostAgreementStep onSignatureChange={setSignatureUri} />
        </View>
      </KeyboardAvoidingWrapper>

      <View style={s.footer}>
        <PrimaryButton label="Sign & Continue" onPress={handleContinue} disabled={!signatureUri} loading={saving} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8 },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12, paddingBottom: 16 },
})

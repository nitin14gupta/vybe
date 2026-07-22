import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { hTap, hSuccess } from '@/lib/haptics'
import { Landmark, CheckCircle2 } from 'lucide-react-native'
import { OutlineButton, PrimaryButton, Input, Screen, BrandedLoader } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { setCached } from '@/lib/queryCache'
import { HostBackdrop, HostProgressBar, StepIcon } from '@/components/host-onboarding'

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/
const FINISHING_DELAY_MS = 900

interface BankInfo {
  bank: string
  branch: string
}

export default function HostPayoutDetailsScreen() {
  const showPill = usePillStore(s => s.show)
  const [holderName, setHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [bankLookupLoading, setBankLookupLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // The bank + branch are fully determined by the IFSC code — no need to make
  // a host type them in. Razorpay's public IFSC lookup is free, unauthenticated.
  useEffect(() => {
    setBankInfo(null)
    if (!IFSC_REGEX.test(ifscCode)) return

    let cancelled = false
    setBankLookupLoading(true)
    fetch(`https://ifsc.razorpay.com/${ifscCode}`)
      .then(res => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then(data => {
        if (cancelled) return
        setBankInfo({ bank: data.BANK, branch: data.BRANCH })
        setErrors(e => ({ ...e, ifscCode: undefined as any }))
      })
      .catch(() => {
        if (cancelled) return
        setErrors(e => ({ ...e, ifscCode: 'Could not verify this IFSC code' }))
      })
      .finally(() => { if (!cancelled) setBankLookupLoading(false) })

    return () => { cancelled = true }
  }, [ifscCode])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (holderName.trim().length < 2) errs.holderName = 'Enter the account holder\'s name'
    if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) errs.accountNumber = '9-18 digit account number'
    if (accountNumber !== confirmAccountNumber) errs.confirmAccountNumber = 'Account numbers don\'t match'
    if (!IFSC_REGEX.test(ifscCode)) errs.ifscCode = 'Invalid IFSC code'
    else if (!bankInfo) errs.ifscCode = bankLookupLoading ? 'Verifying IFSC code…' : 'Could not verify this IFSC code'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || saving) return
    setSaving(true)
    try {
      const updatedProfile = await ApiService.savePayoutDetails({
        account_holder_name: holderName.trim(),
        account_number: accountNumber,
        ifsc_code: ifscCode,
        bank_name: bankInfo!.bank,
      })
      setCached('profile:me', updatedProfile)
      hSuccess()
      setSaving(false)
      setFinishing(true)
      setTimeout(() => router.replace('/(events)/create'), FINISHING_DELAY_MS)
    } catch (err: any) {
      showPill(err?.detail ?? 'Could not save payout details. Try again.', 'error')
      setSaving(false)
    }
  }

  if (finishing) {
    return (
      <Screen transparent style={styles.finishingRoot}>
        <HostBackdrop />
        <BrandedLoader size={48} />
        <Text style={styles.finishingTitle}>You're all set!</Text>
        <Text style={styles.finishingSub}>Setting up your host account…</Text>
      </Screen>
    )
  }

  return (
    <Screen transparent>
      <HostBackdrop />
      <HostProgressBar step={4} total={4} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.header}>
            <StepIcon>
              <Landmark size={32} color={Colors.brandOrange} strokeWidth={1.8} />
            </StepIcon>
            <Text style={styles.title}>Add your payout details</Text>
            <Text style={styles.subtitle}>
              We'll send your ticket earnings straight to this account after each event. Encrypted and used only for payouts.
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <Input
              label="Account holder name"
              placeholder="As per bank records"
              value={holderName}
              onChangeText={setHolderName}
              error={errors.holderName}
            />
            <Input
              label="Account number"
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={t => setAccountNumber(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              secureTextEntry
              error={errors.accountNumber}
            />
            <Input
              label="Confirm account number"
              placeholder="Re-enter account number"
              value={confirmAccountNumber}
              onChangeText={t => setConfirmAccountNumber(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              secureTextEntry
              error={errors.confirmAccountNumber}
            />
            <Input
              label="IFSC code"
              placeholder="e.g. HDFC0001234"
              value={ifscCode}
              onChangeText={t => setIfscCode(t.toUpperCase())}
              error={errors.ifscCode}
            />

            {bankLookupLoading && (
              <View style={styles.bankRow}>
                <ActivityIndicator size="small" color={Colors.inkSecondary} />
                <Text style={styles.bankRowText}>Looking up bank…</Text>
              </View>
            )}
            {bankInfo && !bankLookupLoading && (
              <View style={[styles.bankRow, styles.bankRowResolved]}>
                <CheckCircle2 size={16} color={Colors.accentGreen} strokeWidth={2} />
                <Text style={styles.bankRowResolvedText}>{bankInfo.bank} — {bankInfo.branch}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} disabled={saving} />
          <View style={styles.nextBtn}>
            <PrimaryButton label="Save & Finish" onPress={handleSubmit} loading={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 24 },
  header: { alignItems: 'center', paddingBottom: 24 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  form: { gap: 16 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -6,
    paddingHorizontal: 4,
  },
  bankRowText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  bankRowResolved: {
    backgroundColor: 'rgba(0,196,140,0.1)',
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -2,
  },
  bankRowResolvedText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accentGreen, flex: 1 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.screenPadding, paddingBottom: 16, paddingTop: 8 },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },

  finishingRoot: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  finishingTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    marginTop: 20,
  },
  finishingSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
})

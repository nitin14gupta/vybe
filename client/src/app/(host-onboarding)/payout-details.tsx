import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { hTap, hSuccess } from '@/lib/haptics'
import { Landmark, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react-native'
import { OutlineButton, PrimaryButton, Input, Screen, BrandedLoader, TabSwitcher } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { setCached } from '@/lib/queryCache'
import { useVpaValidation, maskName } from '@/hooks/useVpaValidation'
import { HostBackdrop, HostProgressBar, StepIcon } from '@/components/host-onboarding'

const FINISHING_DELAY_MS = 900

// Bank account is a deliberately unfinished second payout method — early
// hosts have earned nothing yet, so asking for bank + IFSC upfront is pure
// friction with no compliance upside (no TDS obligation below the threshold,
// and we don't even have a TAN yet to withhold it). UPI is the only live
// path; the toggle exists so hosts know bank is coming once it matters.
const PAYOUT_TABS = ['UPI', 'Bank Account'] as const

export default function HostPayoutDetailsScreen() {
  const showPill = usePillStore(s => s.show)
  const [activeTab, setActiveTab] = useState<typeof PAYOUT_TABS[number]>('UPI')
  const [upiId, setUpiId] = useState('')
  const [rzpKey, setRzpKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [nameRevealed, setNameRevealed] = useState(false)

  // Same real VPA verification used on the payment sheet — not just a
  // format check, an actual round-trip that confirms the UPI ID exists and
  // returns the registered account holder's name.
  const { validFormat, checking, vpaResult, vpaError } = useVpaValidation(upiId, rzpKey)
  const canSubmit = validFormat && vpaResult !== null && !vpaError

  useEffect(() => {
    ApiService.getPaymentPublicKey().then(r => setRzpKey(r.key)).catch(() => {})
  }, [])

  const handleTabChange = (tab: string) => {
    if (tab === 'Bank Account') {
      showPill('Bank account payouts are coming soon — use UPI for now', 'default')
      return
    }
    setActiveTab(tab as typeof PAYOUT_TABS[number])
  }

  const handleSubmit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    try {
      const updatedProfile = await ApiService.savePayoutDetails({
        payout_method: 'upi',
        upi_id: upiId.trim(),
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
            <Text style={styles.title}>Where should we send your money?</Text>
            <Text style={styles.subtitle}>
              Add your UPI ID and we'll use it to send your ticket earnings after each event.
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <TabSwitcher tabs={[...PAYOUT_TABS]} activeTab={activeTab} onChange={handleTabChange} />

            <Input
              label="UPI ID"
              placeholder="yourname@upi"
              value={upiId}
              onChangeText={t => setUpiId(t.toLowerCase().trim())}
              error={!checking && vpaError ? 'UPI ID not found. Please check and try again.' : undefined}
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {checking && (
              <View style={styles.vpaRow}>
                <ActivityIndicator size="small" color={Colors.inkSecondary} />
                <Text style={styles.vpaRowText}>Verifying UPI ID…</Text>
              </View>
            )}
            {!checking && vpaResult && (
              <View style={[styles.vpaRow, styles.vpaRowResolved]}>
                <CheckCircle2 size={16} color={Colors.accentGreen} strokeWidth={2} />
                <Text style={styles.vpaRowResolvedText}>
                  {nameRevealed ? vpaResult.name : maskName(vpaResult.name)}
                </Text>
                <Pressable onPress={() => { hTap(); setNameRevealed(v => !v) }} hitSlop={8}>
                  {nameRevealed
                    ? <EyeOff size={16} color={Colors.accentGreen} strokeWidth={2} />
                    : <Eye size={16} color={Colors.accentGreen} strokeWidth={2} />}
                </Pressable>
              </View>
            )}
            {!checking && vpaError && (
              <View style={[styles.vpaRow, styles.vpaRowError]}>
                <XCircle size={16} color={Colors.brandCoral} strokeWidth={2} />
                <Text style={styles.vpaRowErrorText}>Couldn't verify this UPI ID</Text>
              </View>
            )}

            {/*
              Bank account form — disabled for now, kept for the future
              "crossed the TDS threshold" upgrade flow. Re-enable by:
              1. Letting `activeTab === 'Bank Account'` render this block
              2. Restoring the account-holder/account-number/IFSC inputs
                 (see git history for the original UI, incl. the IFSC ->
                 bank-name auto-lookup via Razorpay's public API)
              3. Sending payout_method: 'bank' with those fields to
                 ApiService.savePayoutDetails — the server schema/endpoint
                 already accept this shape unchanged.
            */}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} disabled={saving} />
          <View style={styles.nextBtn}>
            <PrimaryButton label="Save & Finish" onPress={handleSubmit} loading={saving} disabled={!canSubmit} />
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
  vpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -6,
    paddingHorizontal: 4,
  },
  vpaRowText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  vpaRowResolved: {
    backgroundColor: 'rgba(0,196,140,0.1)',
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -2,
  },
  vpaRowResolvedText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accentGreen, flex: 1 },
  vpaRowError: {
    backgroundColor: 'rgba(255,56,100,0.1)',
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -2,
  },
  vpaRowErrorText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandCoral, flex: 1 },
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

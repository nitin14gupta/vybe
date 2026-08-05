import { memo, useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { CheckCircle2, XCircle, Info, Eye, EyeOff, ShieldCheck } from 'lucide-react-native'
import { Input, LogoMark, TabSwitcher } from '@/components/ui'
import { Colors, FontFamily, Radius } from '@/constants'
import type { BankInfo } from '@/hooks/useIfscLookup'

const PAYOUT_TABS = ['Bank Account', 'UPI'] as const
type PayoutTab = typeof PAYOUT_TABS[number]

function PayoutStepBase({
  activeTab,
  onTabChange,
  upiId,
  onUpiIdChange,
  checking,
  vpaResult,
  vpaError,
  holderName,
  onHolderNameChange,
  accountNumber,
  onAccountNumberChange,
  confirmAccountNumber,
  onConfirmAccountNumberChange,
  ifscCode,
  onIfscCodeChange,
  bankLookupLoading,
  bankInfo,
  ifscError,
  accountNumberMismatch,
}: {
  activeTab: PayoutTab
  onTabChange: (tab: string) => void
  upiId: string
  onUpiIdChange: (v: string) => void
  checking: boolean
  vpaResult: { name: string } | null
  vpaError: boolean
  holderName: string
  onHolderNameChange: (v: string) => void
  accountNumber: string
  onAccountNumberChange: (v: string) => void
  confirmAccountNumber: string
  onConfirmAccountNumberChange: (v: string) => void
  ifscCode: string
  onIfscCodeChange: (v: string) => void
  bankLookupLoading: boolean
  bankInfo: BankInfo | null
  ifscError: boolean
  accountNumberMismatch: boolean
}) {
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false)

  const handleAccountNumberChange = useCallback(
    (t: string) => onAccountNumberChange(t.replace(/[^0-9]/g, '')),
    [onAccountNumberChange],
  )
  const handleConfirmAccountNumberChange = useCallback(
    (t: string) => onConfirmAccountNumberChange(t.replace(/[^0-9]/g, '')),
    [onConfirmAccountNumberChange],
  )
  const handleIfscCodeChange = useCallback(
    (t: string) => onIfscCodeChange(t.toUpperCase()),
    [onIfscCodeChange],
  )
  const handleUpiIdChange = useCallback(
    (t: string) => onUpiIdChange(t.toLowerCase().trim()),
    [onUpiIdChange],
  )

  const toggleShowAccountNumber = useCallback(() => setShowAccountNumber(v => !v), [])
  const toggleShowConfirmAccountNumber = useCallback(() => setShowConfirmAccountNumber(v => !v), [])

  const accountNumberIcon = useMemo(
    () => (
      <Pressable onPress={toggleShowAccountNumber} hitSlop={8}>
        {showAccountNumber ? (
          <EyeOff size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
        ) : (
          <Eye size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
        )}
      </Pressable>
    ),
    [showAccountNumber, toggleShowAccountNumber],
  )
  const confirmAccountNumberIcon = useMemo(
    () => (
      <Pressable onPress={toggleShowConfirmAccountNumber} hitSlop={8}>
        {showConfirmAccountNumber ? (
          <EyeOff size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
        ) : (
          <Eye size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
        )}
      </Pressable>
    ),
    [showConfirmAccountNumber, toggleShowConfirmAccountNumber],
  )

  return (
    <View style={s.content}>
      <LogoMark size={64} style={s.logo} />
      <Text style={s.title}>Where should we send your money?</Text>
      <Text style={s.subtitle}>
        Add a payout method. You can update this any time from settings.
      </Text>

      <View style={s.form}>
        <TabSwitcher tabs={[...PAYOUT_TABS]} activeTab={activeTab} onChange={onTabChange} />

        {activeTab === 'Bank Account' ? (
          <>
            <Input
              label="Account holder name"
              placeholder="As per bank records"
              value={holderName}
              onChangeText={onHolderNameChange}
            />
            <Input
              label="Account number"
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              keyboardType="number-pad"
              secureTextEntry={!showAccountNumber}
              rightIcon={accountNumberIcon}
            />
            <Input
              label="Confirm account number"
              placeholder="Re-enter account number"
              value={confirmAccountNumber}
              onChangeText={handleConfirmAccountNumberChange}
              keyboardType="number-pad"
              secureTextEntry={!showConfirmAccountNumber}
              error={accountNumberMismatch ? "Account numbers don't match" : undefined}
              rightIcon={confirmAccountNumberIcon}
            />
            <Input
              label="IFSC code"
              placeholder="e.g. HDFC0001234"
              value={ifscCode}
              onChangeText={handleIfscCodeChange}
              error={!bankLookupLoading && ifscError ? 'Could not verify this IFSC code' : undefined}
              autoCapitalize="characters"
            />

            {bankLookupLoading && (
              <View style={s.vpaRow}>
                <ActivityIndicator size="small" color={Colors.inkSecondary} />
                <Text style={s.vpaRowText}>Looking up bank…</Text>
              </View>
            )}
            {bankInfo && !bankLookupLoading && (
              <View style={[s.vpaRow, s.vpaRowResolved]}>
                <CheckCircle2 size={16} color={Colors.accentGreen} strokeWidth={2} />
                <Text style={s.vpaRowResolvedText}>{bankInfo.bank} — {bankInfo.branch}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Input
              label="UPI ID"
              placeholder="yourname@upi"
              value={upiId}
              onChangeText={handleUpiIdChange}
              error={!checking && vpaError ? 'UPI ID not found. Please check and try again.' : undefined}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {checking && (
              <View style={s.vpaRow}>
                <ActivityIndicator size="small" color={Colors.inkSecondary} />
                <Text style={s.vpaRowText}>Verifying UPI ID…</Text>
              </View>
            )}
            {!checking && vpaResult && (
              <View style={[s.vpaRow, s.vpaRowResolved]}>
                <CheckCircle2 size={16} color={Colors.accentGreen} strokeWidth={2} />
                <Text style={s.vpaRowResolvedText}>{vpaResult.name}</Text>
              </View>
            )}
            {!checking && vpaError && (
              <View style={[s.vpaRow, s.vpaRowError]}>
                <XCircle size={16} color={Colors.brandCoral} strokeWidth={2} />
                <Text style={s.vpaRowErrorText}>Couldn't verify this UPI ID</Text>
              </View>
            )}

            <View style={s.tipRow}>
              <Info size={15} color={Colors.accentGold} strokeWidth={2} />
              <Text style={s.tipText}>
                UPI is quick to set up, but has per-transaction limits. As your events start
                earning more, you'll want to switch to a bank account for uncapped payouts —
                you can do that any time from settings.
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={s.secureRow}>
        <ShieldCheck size={15} color={Colors.inkSecondary} strokeWidth={1.8} />
        <Text style={s.secureText}>Your account details are encrypted and safe with us.</Text>
      </View>
    </View>
  )
}

export const PayoutStep = memo(PayoutStepBase)

const s = StyleSheet.create({
  content: { alignItems: 'center' },
  logo: { marginBottom: 20 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  form: { width: '100%', gap: 16 },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  secureText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
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
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,184,48,0.1)',
    borderRadius: Radius.card,
    padding: 12,
  },
  tipText: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: Colors.accentGold,
    lineHeight: 18,
  },
})

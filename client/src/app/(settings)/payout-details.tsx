import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ArrowLeft, Landmark, CheckCircle2, Eye, EyeOff } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import ApiService, { type PayoutDetailsResponse } from '@/api/apiService'
import { Colors, FontFamily, Radius } from '@/constants'

function maskUpi(upiId: string): string {
  const [handle, domain] = upiId.split('@')
  const visible = handle.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(handle.length - 2, 3))}@${domain}`
}

function maskAccountNumber(accountNumber: string): string {
  return `${'*'.repeat(Math.max(accountNumber.length - 4, 4))}${accountNumber.slice(-4)}`
}

export default function PayoutDetailsScreen() {
  const [details, setDetails] = useState<PayoutDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useFocusEffect(useCallback(() => {
    ApiService.getPayoutDetails()
      .then(setDetails)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []))

  return (
    <View style={s.root}>
      <AppHeader
        title="Payout Details"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : !details?.payout_method ? (
        <View style={s.center}>
          <Landmark size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No payout details yet</Text>
          <Text style={s.emptySub}>You'll add these the first time you create an event.</Text>
        </View>
      ) : (
        <View style={s.content}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionLabel}>PAYOUT METHOD</Text>
            <Pressable
              style={s.revealBtn}
              onPress={() => { hTap(); setRevealed(v => !v) }}
              hitSlop={8}
            >
              {revealed
                ? <EyeOff size={14} color={Colors.brandOrange} strokeWidth={2} />
                : <Eye size={14} color={Colors.brandOrange} strokeWidth={2} />}
              <Text style={s.revealBtnText}>{revealed ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>

          <View style={s.card}>
            <View style={s.row}>
              <View style={s.iconWrap}>
                <CheckCircle2 size={18} color={Colors.accentGreen} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>
                  {details.payout_method === 'upi' ? 'UPI' : 'Bank Account'}
                </Text>
                {details.payout_method === 'upi' && details.upi_id ? (
                  <Text style={s.rowValue}>
                    {revealed ? details.upi_id : maskUpi(details.upi_id)}
                  </Text>
                ) : details.bank ? (
                  <>
                    <Text style={s.rowValue}>{details.bank.account_holder_name}</Text>
                    <Text style={s.rowSub}>
                      {details.bank.bank_name} · {revealed ? details.bank.account_number : maskAccountNumber(details.bank.account_number)}
                    </Text>
                    <Text style={s.rowSub}>{details.bank.ifsc_code}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={s.footnote}>
            Payout details are encrypted and only used to send you ticket earnings after your events.
          </Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  content: { padding: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginLeft: 4,
  },
  revealBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 4, paddingVertical: 2 },
  revealBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.brandOrange },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,196,140,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, marginBottom: 2 },
  rowValue: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  footnote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginTop: 14,
    lineHeight: 18,
    marginHorizontal: 4,
  },
})

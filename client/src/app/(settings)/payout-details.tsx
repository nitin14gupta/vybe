import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ArrowLeft, Landmark, CheckCircle2 } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import ApiService, { type PayoutDetailsResponse } from '@/api/apiService'
import { Colors, FontFamily, Radius } from '@/constants'

export default function PayoutDetailsScreen() {
  const [details, setDetails] = useState<PayoutDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)

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
          <Text style={s.sectionLabel}>PAYOUT METHOD</Text>
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.iconWrap}>
                <CheckCircle2 size={18} color={Colors.accentGreen} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>
                  {details.payout_method === 'upi' ? 'UPI' : 'Bank Account'}
                </Text>
                {details.payout_method === 'upi' && details.upi_id_masked ? (
                  <Text style={s.rowValue}>{details.upi_id_masked}</Text>
                ) : details.bank_masked ? (
                  <>
                    <Text style={s.rowValue}>{details.bank_masked.account_holder_name}</Text>
                    <Text style={s.rowSub}>
                      {details.bank_masked.bank_name} · {details.bank_masked.account_number_masked}
                    </Text>
                    <Text style={s.rowSub}>{details.bank_masked.ifsc_code}</Text>
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
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
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

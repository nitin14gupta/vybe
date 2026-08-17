import { View, Text, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

function BillRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={s.billRow}>
      <Text style={[s.billLabel, green && { color: Colors.accentGreen }]}>{label}</Text>
      <Text style={[s.billValue, green && { color: Colors.accentGreen }]}>{value}</Text>
    </View>
  )
}

export function PaymentOrderSummary({
  eventTitle,
  ticketPrice,
  platformFee,
  amountToPay,
  walletApplied,
  expanded,
  onToggle,
}: {
  eventTitle: string
  ticketPrice: number
  platformFee: number
  amountToPay: number
  walletApplied: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <View style={s.billCard}>
        <Text style={s.billTitle} numberOfLines={1}>{eventTitle}</Text>
        <Pressable style={s.billSummaryRow} onPress={() => { hTap(); onToggle() }}>
          <Text style={s.billSummaryLabel}>
            To Pay: <Text style={s.billSummaryValue}>₹{amountToPay}</Text>
          </Text>
          {expanded ? (
            <ChevronUp size={18} color={Colors.inkSecondary} strokeWidth={2.2} />
          ) : (
            <ChevronDown size={18} color={Colors.inkSecondary} strokeWidth={2.2} />
          )}
        </Pressable>

        {expanded && (
          <View style={s.billDetails}>
            <BillRow label="Ticket price" value={`₹${ticketPrice}`} />
            <BillRow label="Platform fee" value={`₹${platformFee}`} />
            {walletApplied > 0 && <BillRow label="Gorave Wallet applied" value={`-₹${walletApplied}`} green />}
            <View style={s.billDivider} />
            <View style={s.billTotalRow}>
              <Text style={s.billTotalLabel}>Total</Text>
              <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.billTotalBadge}>
                <Text style={s.billTotalValue}>₹{amountToPay}</Text>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>

      {walletApplied > 0 && (
        <View style={s.walletBanner}>
          <Wallet size={16} color={Colors.accentGreen} strokeWidth={1.8} />
          <Text style={s.walletBannerText}>₹{walletApplied} from Gorave Wallet will be used</Text>
        </View>
      )}
    </>
  )
}

const s = StyleSheet.create({
  billCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10 },
  billTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, marginBottom: 4 },
  billSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billSummaryLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  billSummaryValue: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.accentGreen },
  billDetails: { gap: 10, marginTop: 2 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  billValue: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  billDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginVertical: 4 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billTotalLabel: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  billTotalBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  billTotalValue: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },

  walletBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: withOpacity(Colors.accentGreen, 0.08), borderRadius: 12, borderWidth: 1, borderColor: withOpacity(Colors.accentGreen, 0.18), paddingHorizontal: 14, paddingVertical: 10 },
  walletBannerText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accentGreen, flex: 1 },
})

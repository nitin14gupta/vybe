import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { WalletTransaction } from '@/api/apiService'

// Postgres returns timestamps like "2025-06-12 10:30:00.123456+05:30" — normalise to ISO
function parseDbDate(str: string | null | undefined): Date | null {
  if (!str) return null
  const d = new Date(str.replace(' ', 'T').replace(/(\+\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(str: string | null | undefined) {
  const d = parseDbDate(str)
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function WalletTransactionRow({ item }: { item: WalletTransaction }) {
  const isCredit = item.type === 'credit'

  return (
    <View style={s.txRow}>
      {item.event_cover ? (
        <Image source={{ uri: item.event_cover }} style={s.txCover} cachePolicy="memory-disk" priority="low" transition={150} />
      ) : (
        <View style={[s.txIconWrap, isCredit ? s.txIconCredit : s.txIconDebit]}>
          {isCredit
            ? <ArrowDownLeft size={16} color={Colors.accentGreen} strokeWidth={2} />
            : <ArrowUpRight size={16} color={Colors.inkSecondary} strokeWidth={2} />
          }
        </View>
      )}
      <View style={s.txMid}>
        <Text style={s.txDesc} numberOfLines={1}>
          {item.event_title ?? item.description ?? (isCredit ? 'Wallet credit' : 'Wallet debit')}
        </Text>
        <Text style={s.txDate}>{fmtDate(item.created_at)}</Text>
        {isCredit && item.expires_at && (
          <Text style={s.txExpiry}>Expires {fmtDate(item.expires_at)}</Text>
        )}
      </View>
      <Text style={[s.txAmount, isCredit ? s.txAmountCredit : s.txAmountDebit]}>
        {isCredit ? '+' : '-'}₹{item.amount_inr}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.surface },
  txIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txCover: { width: 36, height: 36, borderRadius: 10 },
  txIconCredit: { backgroundColor: 'rgba(0,196,140,0.12)' },
  txIconDebit: { backgroundColor: 'rgba(255,255,255,0.06)' },
  txMid: { flex: 1 },
  txDesc: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  txDate: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  txExpiry: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginTop: 1 },
  txAmount: { fontFamily: FontFamily.headingBold, fontSize: 16 },
  txAmountCredit: { color: Colors.accentGreen },
  txAmountDebit: { color: Colors.inkSecondary },
  txDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginLeft: 68 },
})

export function WalletTxDivider() {
  return <View style={s.txDivider} />
}

import {
  View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Wallet, ArrowDownLeft, ArrowUpRight, HeadphonesIcon, Receipt } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily } from '@/constants'
import { useWallet } from '@/hooks/useWallet'
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

// ── Transaction row ───────────────────────────────────────────────────────────

function TransactionRow({ item }: { item: WalletTransaction }) {
  const isCredit = item.type === 'credit'

  return (
    <View style={s.txRow}>
      <View style={[s.txIconWrap, isCredit ? s.txIconCredit : s.txIconDebit]}>
        {isCredit
          ? <ArrowDownLeft size={16} color={Colors.accentGreen} strokeWidth={2} />
          : <ArrowUpRight size={16} color={Colors.inkSecondary} strokeWidth={2} />
        }
      </View>
      <View style={s.txMid}>
        <Text style={s.txDesc} numberOfLines={1}>
          {item.description ?? (isCredit ? 'Wallet credit' : 'Wallet debit')}
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

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const { balance, transactions, loading, refreshing, reload } = useWallet()

  return (
    <View style={s.root}>
      <AppHeader
        title="Vybe Wallet"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TransactionRow item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => reload(true)}
            tintColor={Colors.brandOrange}
            colors={[Colors.brandOrange]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Balance card */}
            <LinearGradient
              colors={['#FF6B35', '#FF3864']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.balanceCard}
            >
              <View style={s.balanceIconRow}>
                <Wallet size={20} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
                <Text style={s.balanceLabel}>Wallet Balance</Text>
              </View>
              {loading ? (
                <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
              ) : (
                <Text style={s.balanceAmount}>₹{balance}</Text>
              )}
              <Text style={s.balanceNote}>Credits expire 6 months from date earned</Text>
            </LinearGradient>

            {/* Info note */}
            <Pressable style={s.infoCard} onPress={() => router.push('/(settings)/support' as any)}>
              <View style={s.infoRow}>
                <View style={s.infoIconWrap}>
                  <HeadphonesIcon size={15} color={Colors.brandOrange} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoText}>Credits can only be used on Vybe events.</Text>
                  <Text style={s.infoSub}>Need a bank refund or have a question? <Text style={s.infoLink}>Contact Support →</Text></Text>
                </View>
              </View>
            </Pressable>

            {transactions.length > 0 && (
              <Text style={s.sectionLabel}>TRANSACTIONS</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconWrap}>
                <Receipt size={32} color={Colors.inkDisabled} strokeWidth={1.5} />
              </View>
              <Text style={s.emptyTitle}>No transactions yet</Text>
              <Text style={s.emptySubtitle}>
                When you receive refunds or pay for events with your wallet, they'll appear here.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={s.txDivider} />}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  balanceCard: { margin: 16, borderRadius: 20, padding: 24 },
  balanceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  balanceLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontFamily: FontFamily.headingBold, fontSize: 48, color: '#fff', marginVertical: 4 },
  balanceNote: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  infoCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 19 },
  infoSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 2 },
  infoLink: { fontFamily: FontFamily.bodyMedium, color: Colors.brandOrange },

  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, marginTop: 8, marginBottom: 4, marginLeft: 20,
  },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.surface },
  txIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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

  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary, marginBottom: 8 },
  emptySubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 21 },
})

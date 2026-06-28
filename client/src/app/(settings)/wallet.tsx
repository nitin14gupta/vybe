import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { ChevronLeft, Wallet, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Colors, FontFamily } from '@/constants'
import { useWallet } from '@/hooks/useWallet'
import { usePillStore } from '@/store/pillStore'
import { hSuccess, hTap } from '@/lib/haptics'
import ApiService, { type WalletTransaction } from '@/api/apiService'

// ── Confirmation sheet for bank refund ───────────────────────────────────────

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

function RefundConfirmSheetCore({ amount, onConfirm, onClose }: { amount: number; onConfirm: () => void; onClose: () => void }) {
  const ref = useRef<BottomSheetModal>(null)
  useEffect(() => { ref.current?.present() }, [])

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.sheetHandle}
    >
      <BottomSheetView style={s.sheetContent}>
        <Text style={s.sheetTitle}>Request Bank Refund?</Text>
        <Text style={s.sheetBody}>
          ₹{amount} will be transferred to your bank account within 5–10 business days. Your Vybe Wallet will be cleared immediately.
        </Text>
        <Pressable style={s.sheetConfirmBtn} onPress={() => { hSuccess(); onConfirm() }}>
          <Text style={s.sheetConfirmText}>YES, REQUEST REFUND</Text>
        </Pressable>
        <Pressable style={s.sheetCancelBtn} onPress={() => { hTap(); onClose() }}>
          <Text style={s.sheetCancelText}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

function RefundConfirmSheet({ visible, amount, onConfirm, onClose }: { visible: boolean; amount: number; onConfirm: () => void; onClose: () => void }) {
  if (!visible) return null
  return <RefundConfirmSheetCore amount={amount} onConfirm={onConfirm} onClose={onClose} />
}

// ── Transaction row ───────────────────────────────────────────────────────────

function TransactionRow({ item }: { item: WalletTransaction }) {
  const isCredit = item.type === 'credit'
  const isPending = item.type === 'refund_requested'

  const date = new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <View style={s.txRow}>
      <View style={[s.txIconWrap, isCredit ? s.txIconCredit : isPending ? s.txIconPending : s.txIconDebit]}>
        {isPending
          ? <Clock size={16} color={Colors.accentGold} strokeWidth={2} />
          : isCredit
            ? <ArrowDownLeft size={16} color={Colors.accentGreen} strokeWidth={2} />
            : <ArrowUpRight size={16} color={Colors.inkSecondary} strokeWidth={2} />
        }
      </View>
      <View style={s.txMid}>
        <Text style={s.txDesc} numberOfLines={1}>
          {item.description ?? (isCredit ? 'Wallet credit' : 'Wallet debit')}
        </Text>
        <Text style={s.txDate}>{date}</Text>
        {isCredit && item.expires_at && (
          <Text style={s.txExpiry}>
            Expires {new Date(item.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>
      <View style={s.txRight}>
        {isPending ? (
          <View style={s.pendingChip}>
            <Text style={s.pendingChipText}>Pending</Text>
          </View>
        ) : (
          <Text style={[s.txAmount, isCredit ? s.txAmountCredit : s.txAmountDebit]}>
            {isCredit ? '+' : '-'}₹{item.amount_inr}
          </Text>
        )}
      </View>
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const { balance, transactions, loading, refreshing, reload } = useWallet()
  const showPill = usePillStore(s => s.show)
  const [refundConfirm, setRefundConfirm] = useState(false)
  const [refunding, setRefunding] = useState(false)

  const handleBankRefund = async () => {
    setRefundConfirm(false)
    setRefunding(true)
    try {
      const res = await ApiService.requestBankRefund()
      showPill(`₹${res.amount} refund requested — 5–10 business days`, 'default')
      reload()
    } catch (err: any) {
      const msg = err?.detail ?? 'Failed to request refund. Try again.'
      showPill(msg, 'error')
    } finally {
      setRefunding(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Vybe Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

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
              {balance > 0 && (
                <Pressable
                  style={s.refundBtn}
                  onPress={() => { hTap(); setRefundConfirm(true) }}
                  disabled={refunding}
                >
                  {refunding
                    ? <ActivityIndicator color={Colors.brandOrange} size="small" />
                    : <Text style={s.refundBtnText}>Request Bank Refund</Text>
                  }
                </Pressable>
              )}
            </LinearGradient>

            {/* Section header */}
            {transactions.length > 0 && (
              <Text style={s.sectionLabel}>TRANSACTIONS</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>🪙</Text>
              <Text style={s.emptyTitle}>No transactions yet</Text>
              <Text style={s.emptySubtitle}>
                When you receive refunds or make payments via wallet, they'll appear here.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={s.txDivider} />}
      />

      <RefundConfirmSheet
        visible={refundConfirm}
        amount={balance}
        onConfirm={handleBankRefund}
        onClose={() => setRefundConfirm(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary,
  },

  // Balance card
  balanceCard: {
    margin: 16, borderRadius: 20, padding: 24,
  },
  balanceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  balanceLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: {
    fontFamily: FontFamily.headingBold, fontSize: 48, color: '#fff', marginVertical: 4,
  },
  balanceNote: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  refundBtn: {
    marginTop: 20, backgroundColor: '#fff', borderRadius: 24,
    paddingVertical: 12, alignItems: 'center',
  },
  refundBtnText: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange, letterSpacing: 0.3,
  },

  // Section label
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, marginTop: 8, marginBottom: 4, marginLeft: 20,
  },

  // Transaction rows
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  txIconWrap: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  txIconCredit: { backgroundColor: 'rgba(0,196,140,0.12)' },
  txIconDebit: { backgroundColor: 'rgba(255,255,255,0.06)' },
  txIconPending: { backgroundColor: 'rgba(255,184,48,0.12)' },
  txMid: { flex: 1 },
  txDesc: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  txDate: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  txExpiry: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginTop: 1 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontFamily: FontFamily.headingBold, fontSize: 16 },
  txAmountCredit: { color: Colors.accentGreen },
  txAmountDebit: { color: Colors.inkSecondary },
  txDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginLeft: 68 },
  pendingChip: {
    backgroundColor: 'rgba(255,184,48,0.15)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pendingChipText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.accentGold },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary, marginBottom: 8 },
  emptySubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 21 },

  // Refund confirm sheet
  sheetBg: { backgroundColor: '#141414' },
  sheetHandle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 },
  sheetTitle: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, marginBottom: 12 },
  sheetBody: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, lineHeight: 22, marginBottom: 28 },
  sheetConfirmBtn: {
    height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  sheetConfirmText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: '#111', letterSpacing: 1.2 },
  sheetCancelBtn: { alignItems: 'center', paddingVertical: 12 },
  sheetCancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
})

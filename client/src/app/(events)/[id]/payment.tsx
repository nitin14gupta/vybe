import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Switch, TextInput, Linking,
  AppState, type AppStateStatus,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import RazorpayCheckout from 'react-native-razorpay'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import {
  ArrowLeft, CreditCard, Building2,
  ChevronRight, Wallet, CheckCircle, X,
} from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess, hSelection } from '@/lib/haptics'

// ── UPI app definitions ───────────────────────────────────────────────────────

interface UpiOption {
  key: string
  label: string
  color: string
  initial: string
  rzpApp: string
}

const UPI_OPTIONS: UpiOption[] = [
  { key: 'gpay',    label: 'Google Pay', color: '#4285F4', initial: 'G', rzpApp: 'google_pay' },
  { key: 'phonepe', label: 'PhonePe',   color: '#5F259F', initial: 'P', rzpApp: 'phonepe' },
  { key: 'paytm',   label: 'Paytm',     color: '#00BAF2', initial: 'T', rzpApp: 'paytm' },
  { key: 'bhim',    label: 'BHIM',      color: '#1A6B3B', initial: 'B', rzpApp: 'bhim' },
]

// ── Backdrop helper ───────────────────────────────────────────────────────────

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

// ── UPI ID entry sheet ────────────────────────────────────────────────────────

function UpiIdSheetCore({ onPay, onClose }: { onPay: (vpa: string) => void; onClose: () => void }) {
  const ref = useRef<BottomSheetModal>(null)
  const [vpa, setVpa] = useState('')
  const valid = /^[\w.\-]+@[\w]+$/.test(vpa.trim())

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
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={s.sheetContent}>
        <View style={s.sheetHeaderRow}>
          <Text style={s.sheetTitle}>Enter UPI ID</Text>
          <Pressable onPress={() => { hTap(); onClose() }} hitSlop={10}>
            <X size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
          </Pressable>
        </View>
        <TextInput
          style={s.upiInput}
          placeholder="yourname@oksbi"
          placeholderTextColor={Colors.inkDisabled}
          value={vpa}
          onChangeText={setVpa}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />
        <Text style={s.upiHint}>e.g. name@oksbi · name@ybl · name@paytm</Text>
        <Pressable
          style={[s.payBtn, !valid && s.payBtnDisabled]}
          onPress={() => { if (valid) { hSuccess(); onPay(vpa.trim()) } }}
          disabled={!valid}
        >
          <Text style={s.payBtnText}>SEND COLLECT REQUEST</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

function UpiIdSheet({ visible, onPay, onClose }: { visible: boolean; onPay: (vpa: string) => void; onClose: () => void }) {
  if (!visible) return null
  return <UpiIdSheetCore onPay={onPay} onClose={onClose} />
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const showPill = usePillStore(s => s.show)

  const [eventTitle, setEventTitle]   = useState('')
  const [ticketPrice, setTicketPrice] = useState(0)
  const [platformFee, setPlatformFee] = useState(0)
  const [total, setTotal]             = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [paying, setPaying]           = useState(false)
  const [payingMsg, setPayingMsg]     = useState('Processing…')

  const [walletEnabled, setWalletEnabled] = useState(false)
  const walletApplied = walletEnabled ? Math.min(walletBalance, total) : 0
  const amountToPay   = Math.max(0, total - walletApplied)

  // UPI ID sheet
  const [upiSheetOpen, setUpiSheetOpen] = useState(false)

  // Polling state (for UPI flows)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingOrderId = useRef<string | null>(null)

  useFocusEffect(useCallback(() => {
    if (!id) return
    setLoading(true)
    Promise.all([ApiService.getEvent(id), ApiService.getWallet()])
      .then(([ev, wallet]) => {
        setEventTitle(ev.title)
        setTicketPrice(ev.price_inr)
        const fee = Math.round(ev.price_inr * 0.05)
        setPlatformFee(fee)
        setTotal(ev.price_inr + fee)
        setWalletBalance(wallet.balance)
      })
      .catch(() => { showPill("Couldn't load payment details", 'error'); router.back() })
      .finally(() => setLoading(false))

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id]))

  // ── Full wallet payment ────────────────────────────────────────────────────

  const doWalletPay = async () => {
    if (!id || paying) return
    setPaying(true)
    setPayingMsg('Processing…')
    try {
      await ApiService.walletPay(id)
      hSuccess()
      router.replace(`/(events)/${id}/ticket` as any)
    } catch (err: any) {
      showPill(err?.detail ?? 'Payment failed. Try again.', 'error')
      setPaying(false)
    }
  }

  // ── Poll for UPI payment capture ──────────────────────────────────────────

  const startPolling = (orderId: string) => {
    pendingOrderId.current = orderId
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await ApiService.getPaymentStatus(orderId)
        if (res.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current)
          hSuccess()
          router.replace(`/(events)/${id}/ticket` as any)
        } else if (res.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          showPill('Payment failed or expired. Try again.', 'error')
          setPaying(false)
        } else if (attempts >= 40) {
          // 40 × 3s = 2 minutes
          if (pollRef.current) clearInterval(pollRef.current)
          showPill("Payment not confirmed yet — we'll notify you when it clears.", 'default')
          setPaying(false)
        }
      } catch {
        if (attempts >= 40) {
          if (pollRef.current) clearInterval(pollRef.current)
          setPaying(false)
        }
      }
    }, 3000)
  }

  // Resume polling if user backgrounds app during UPI and comes back
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && pendingOrderId.current && !pollRef.current) {
        setPayingMsg('Checking payment…')
        startPolling(pendingOrderId.current)
      }
    })
    return () => sub.remove()
  }, [])

  // ── UPI intent: opens GPay/PhonePe etc. via Linking ──────────────────────
  // Server creates the payment via Razorpay S2S API and returns a upi:// URL.
  // No Razorpay UI appears. Falls back to RazorpayCheckout if S2S not available (test mode).

  const handleUpiApp = async (opt: UpiOption) => {
    if (!id || paying) return
    hTap()

    if (amountToPay === 0) { await doWalletPay(); return }

    setPaying(true)
    setPayingMsg('Preparing payment…')

    try {
      const res = await ApiService.createUpiIntent(id, walletApplied)

      if (res.full_wallet) { await doWalletPay(); return }

      if (res.intent_url) {
        // S2S UPI intent URL available — open the UPI app directly, no Razorpay UI
        await Linking.openURL(res.intent_url)
        setPayingMsg('Waiting for payment…')
        startPolling(res.order_id!)
      } else if (res.order_id && res.razorpay_key && res.amount) {
        // Test mode fallback: S2S UPI not available, use RazorpayCheckout (shows Razorpay UI)
        setPayingMsg('Opening checkout…')
        const data = await RazorpayCheckout.open({
          key: res.razorpay_key,
          amount: String(res.amount * 100),
          currency: 'INR',
          name: 'Vybe',
          description: eventTitle,
          order_id: res.order_id,
          theme: { color: '#FF6B35' },
        })
        await ApiService.verifyPayment({
          event_id: id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          wallet_amount: walletApplied,
        })
        hSuccess()
        router.replace(`/(events)/${id}/ticket` as any)
      }
    } catch (err: any) {
      if (pollRef.current) clearInterval(pollRef.current)
      if (err?.code !== 0) {
        showPill(err?.description ?? err?.detail ?? 'Payment failed. Try again.', 'error')
      }
      setPaying(false)
    }
  }

  // ── UPI Collect: user enters VPA, Razorpay sends a collect request ────────

  const handleUpiCollect = async (vpa: string) => {
    if (!id || paying) return
    setUpiSheetOpen(false)

    if (amountToPay === 0) { await doWalletPay(); return }

    setPaying(true)
    setPayingMsg('Sending collect request…')

    try {
      const res = await ApiService.createUpiCollect(id, vpa, walletApplied)
      if (res.full_wallet) { await doWalletPay(); return }
      setPayingMsg('Check your UPI app to approve…')
      startPolling(res.order_id!)
    } catch (err: any) {
      showPill(err?.detail ?? 'Could not send collect request. Check your UPI ID.', 'error')
      setPaying(false)
    }
  }

  // ── Card / Net Banking: RazorpayCheckout native SDK (needed for PCI) ─────

  const handleCard = async () => {
    if (!id || paying) return
    hTap()

    if (amountToPay === 0) { await doWalletPay(); return }

    setPaying(true)
    setPayingMsg('Preparing payment…')

    try {
      const order = await ApiService.createPaymentOrder(id, walletApplied)

      if (order.full_wallet) { await doWalletPay(); return }
      if (!order.order_id || !order.razorpay_key || !order.amount) {
        showPill('Could not initialise payment. Try again.', 'error')
        setPaying(false)
        return
      }

      const data = await RazorpayCheckout.open({
        key: order.razorpay_key,
        amount: String(order.amount * 100),
        currency: 'INR',
        name: 'Vybe',
        description: eventTitle,
        order_id: order.order_id,
        theme: { color: '#FF6B35' },
      })

      await ApiService.verifyPayment({
        event_id: id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        wallet_amount: walletApplied,
      })
      hSuccess()
      router.replace(`/(events)/${id}/ticket` as any)
    } catch (err: any) {
      if (err?.code !== 0) {
        showPill(err?.description ?? err?.detail ?? 'Payment failed. Try again.', 'error')
      }
      setPaying(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  // ── Paying overlay ────────────────────────────────────────────────────────

  if (paying) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
        <Text style={s.payingMsg}>{payingMsg}</Text>
        {payingMsg.includes('Waiting') || payingMsg.includes('Check') ? (
          <Pressable style={s.cancelBtn} onPress={() => {
            if (pollRef.current) clearInterval(pollRef.current)
            pendingOrderId.current = null
            setPaying(false)
          }}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Bill */}
        <View style={s.billCard}>
          <Text style={s.billTitle} numberOfLines={1}>{eventTitle}</Text>
          <BillRow label="Ticket price" value={`₹${ticketPrice}`} />
          <BillRow label="Platform fee (5%)" value={`₹${platformFee}`} />
          {walletApplied > 0 && <BillRow label="Vybe Wallet" value={`-₹${walletApplied}`} green />}
          <View style={s.billDivider} />
          <View style={s.billTotalRow}>
            <Text style={s.billTotalLabel}>To Pay</Text>
            <LinearGradient colors={['#FF6B35', '#FF3864']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.billTotalBadge}>
              <Text style={s.billTotalValue}>₹{amountToPay}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Wallet toggle */}
        {walletBalance > 0 && (
          <View style={s.walletCard}>
            <View style={s.walletLeft}>
              <View style={s.walletIconWrap}>
                <Wallet size={18} color={Colors.brandOrange} strokeWidth={1.8} />
              </View>
              <View>
                <Text style={s.walletLabel}>Vybe Wallet</Text>
                <Text style={s.walletSub}>₹{walletBalance} available</Text>
              </View>
            </View>
            <Switch
              value={walletEnabled}
              onValueChange={v => { hSelection(); setWalletEnabled(v) }}
              trackColor={{ false: Colors.divider, true: Colors.brandOrange }}
              thumbColor="#fff"
            />
          </View>
        )}

        {amountToPay === 0 ? (
          /* Full wallet pay */
          <View style={s.walletOnlyWrap}>
            <Pressable style={s.walletOnlyBtn} onPress={doWalletPay}>
              <LinearGradient colors={['#FF6B35', '#FF3864']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.walletOnlyGradient}>
                <Wallet size={18} color="#fff" strokeWidth={2} />
                <Text style={s.walletOnlyText}>PAY WITH WALLET</Text>
              </LinearGradient>
            </Pressable>
            <Text style={s.walletOnlyNote}>₹{walletApplied} will be deducted from your Vybe Wallet</Text>
          </View>
        ) : (
          <>
            {/* UPI */}
            <Text style={s.sectionLabel}>PAY VIA UPI</Text>
            <View style={s.methodCard}>
              {UPI_OPTIONS.map((opt, i) => (
                <Pressable
                  key={opt.key}
                  style={[s.methodRow, i < UPI_OPTIONS.length - 1 && s.methodBorder]}
                  onPress={() => handleUpiApp(opt)}
                >
                  <View style={[s.dot, { backgroundColor: opt.color }]}>
                    <Text style={s.dotText}>{opt.initial}</Text>
                  </View>
                  <Text style={s.methodLabel}>{opt.label}</Text>
                  <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
                </Pressable>
              ))}
              <Pressable style={s.methodRow} onPress={() => { hTap(); setUpiSheetOpen(true) }}>
                <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
                  <Text style={[s.dotText, { color: Colors.inkSecondary, fontSize: 14 }]}>@</Text>
                </View>
                <Text style={s.methodLabel}>Other / Enter UPI ID</Text>
                <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
              </Pressable>
            </View>

            {/* Card + Net Banking */}
            <Text style={s.sectionLabel}>CARDS & NET BANKING</Text>
            <View style={s.methodCard}>
              <Pressable style={[s.methodRow, s.methodBorder]} onPress={handleCard}>
                <View style={[s.dot, { backgroundColor: '#1A3A6B' }]}>
                  <CreditCard size={15} color="#fff" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.methodLabel}>Credit / Debit Card</Text>
                  <Text style={s.methodSub}>Visa, Mastercard, RuPay</Text>
                </View>
                <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
              </Pressable>
              <Pressable style={s.methodRow} onPress={handleCard}>
                <View style={[s.dot, { backgroundColor: '#1A4A3A' }]}>
                  <Building2 size={15} color="#fff" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.methodLabel}>Net Banking</Text>
                  <Text style={s.methodSub}>All major banks</Text>
                </View>
                <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
              </Pressable>
            </View>
          </>
        )}

        <View style={s.secureRow}>
          <CheckCircle size={13} color={Colors.inkDisabled} strokeWidth={1.6} />
          <Text style={s.secureText}>Secure payment · Instant wallet refund if event is cancelled</Text>
        </View>
      </ScrollView>

      <UpiIdSheet
        visible={upiSheetOpen}
        onPay={handleUpiCollect}
        onClose={() => setUpiSheetOpen(false)}
      />
    </View>
  )
}

function BillRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={s.billRow}>
      <Text style={[s.billLabel, green && { color: Colors.accentGreen }]}>{label}</Text>
      <Text style={[s.billValue, green && { color: Colors.accentGreen }]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },

  billCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10 },
  billTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, marginBottom: 4 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  billValue: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  billDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginVertical: 4 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billTotalLabel: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  billTotalBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  billTotalValue: { fontFamily: FontFamily.headingBold, fontSize: 20, color: '#fff' },

  walletCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  walletLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  walletSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },

  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, marginLeft: 4, marginTop: 4,
  },

  methodCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  methodBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  methodLabel: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  methodSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  dot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: '#fff' },

  walletOnlyWrap: { gap: 10, marginTop: 8 },
  walletOnlyBtn: { borderRadius: 28, overflow: 'hidden' },
  walletOnlyGradient: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  walletOnlyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.8 },
  walletOnlyNote: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  secureText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'center' },

  payingMsg: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 28, marginTop: 8 },
  cancelBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },

  sheetBg: { backgroundColor: '#141414' },
  sheetHandle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  upiInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkPrimary, marginBottom: 8,
  },
  upiHint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginBottom: 24 },
  payBtn: { height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.45 },
  payBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: '#111', letterSpacing: 1.2 },
})

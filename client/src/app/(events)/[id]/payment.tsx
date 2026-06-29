import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Switch, TextInput, Image,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import RazorpayCustomUI from 'react-native-customui'
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
import { usePaymentData } from '@/hooks/usePaymentData'
import { useInstalledUpiApps } from '@/hooks/useInstalledUpiApps'
import type { UpiApp } from '@/hooks/useInstalledUpiApps'

// ── Backdrop ──────────────────────────────────────────────────────────────────

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

// ── UPI ID sheet ──────────────────────────────────────────────────────────────

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
          <Text style={s.payBtnText}>Send Collect Request</Text>
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

  const { eventTitle, ticketPrice, platformFee, total, walletBalance, loading, error } = usePaymentData(id)
  const { apps: upiApps, loading: upiAppsLoading } = useInstalledUpiApps()

  const [paying, setPaying]   = useState(false)
  const [payingMsg, setPayingMsg] = useState('Processing…')
  const [walletEnabled, setWalletEnabled] = useState(false)
  const [upiSheetOpen, setUpiSheetOpen]   = useState(false)

  const walletApplied = walletEnabled ? Math.min(walletBalance, total) : 0
  const amountToPay   = Math.max(0, total - walletApplied)

  // Navigate back on data load error
  useEffect(() => {
    if (error) { showPill(error, 'error'); router.back() }
  }, [error])

  // ── Full wallet payment ──────────────────────────────────────────────────

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

  // ── UPI intent via react-native-customui ─────────────────────────────────
  // Opens the specific UPI app directly. Promise resolves when user completes
  // payment inside the UPI app and returns to Vybe. No polling needed.

  const handleUpiApp = async (packageName: string) => {
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

      setPayingMsg('Opening UPI app…')
      const data: any = await RazorpayCustomUI.open({
        key_id: order.razorpay_key,
        order_id: order.order_id,
        amount: String(order.amount * 100),
        currency: 'INR',
        name: 'Vybe',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'intent',
        upi_app_package_name: packageName,
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

  // ── UPI collect (enter VPA) ──────────────────────────────────────────────

  const handleUpiCollect = async (vpa: string) => {
    if (!id || paying) return
    setUpiSheetOpen(false)

    if (amountToPay === 0) { await doWalletPay(); return }

    setPaying(true)
    setPayingMsg('Sending collect request…')

    try {
      const order = await ApiService.createPaymentOrder(id, walletApplied)
      if (order.full_wallet) { await doWalletPay(); return }
      if (!order.order_id || !order.razorpay_key || !order.amount) {
        showPill('Could not initialise payment. Try again.', 'error')
        setPaying(false)
        return
      }

      setPayingMsg('Check your UPI app to approve…')
      const data: any = await RazorpayCustomUI.open({
        key_id: order.razorpay_key,
        order_id: order.order_id,
        amount: String(order.amount * 100),
        currency: 'INR',
        name: 'Vybe',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'collect',
        '_[vpa]': vpa,
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
        showPill(err?.description ?? err?.detail ?? 'UPI collect failed. Try again.', 'error')
      }
      setPaying(false)
    }
  }

  // ── Card / Net Banking via standard RazorpayCheckout ────────────────────
  // Card input must go through Razorpay's SDK (PCI). User tapped "Card" in
  // our UI so they won't see Razorpay's UPI selection — just the card form.

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
              {upiAppsLoading ? (
                <View style={s.upiLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.inkDisabled} />
                </View>
              ) : upiApps.length === 0 ? (
                <View style={s.upiEmptyRow}>
                  <Text style={s.upiEmptyText}>No UPI apps found on this device</Text>
                </View>
              ) : (
                upiApps.map((app, i) => (
                  <Pressable
                    key={app.package_name}
                    style={[s.methodRow, i < upiApps.length - 1 && s.methodBorder]}
                    onPress={() => handleUpiApp(app.package_name)}
                  >
                    {app.app_icon ? (
                      <Image
                        source={{ uri: `data:image/png;base64,${app.app_icon}` }}
                        style={s.upiAppIcon}
                      />
                    ) : (
                      <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
                        <Text style={[s.dotText, { fontSize: 13, color: Colors.inkSecondary }]}>
                          {app.app_name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <Text style={s.methodLabel}>{app.app_name}</Text>
                    <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
                  </Pressable>
                ))
              )}
              <Pressable
                style={[s.methodRow, upiApps.length > 0 && s.methodTopBorder]}
                onPress={() => { hTap(); setUpiSheetOpen(true) }}
              >
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
  methodTopBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  methodLabel: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  methodSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  dot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: '#fff' },

  upiAppIcon: { width: 36, height: 36, borderRadius: 10 },
  upiLoadingRow: { paddingVertical: 20, alignItems: 'center' },
  upiEmptyRow: { paddingHorizontal: 16, paddingVertical: 14 },
  upiEmptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled },

  walletOnlyWrap: { gap: 10, marginTop: 8 },
  walletOnlyBtn: { borderRadius: 28, overflow: 'hidden' },
  walletOnlyGradient: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  walletOnlyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.8 },
  walletOnlyNote: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  secureText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'center' },

  payingMsg: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },

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

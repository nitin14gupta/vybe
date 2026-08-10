import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import RazorpayCustomUI from 'react-native-customui'
import { ArrowLeft, CheckCircle } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader } from '@/components/ui'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { usePaymentData } from '@/hooks/usePaymentData'
import { useInstalledUpiApps } from '@/hooks/useInstalledUpiApps'
import { useLastPaymentStore } from '@/store/lastPaymentStore'
import { UpiIdSheet } from '@/components/upi/UpiIdSheet'
import { PaymentFailedSheet } from '@/components/upi/PaymentFailedSheet'
import { PaymentWalletSuccessOverlay } from '@/components/events/PaymentWalletSuccessOverlay'
import { PaymentOrderSummary } from '@/components/events/PaymentOrderSummary'
import { PaymentMethodSelector } from '@/components/events/PaymentMethodSelector'

export default function PaymentScreen() {
  const { id, wallet: walletParam } = useLocalSearchParams<{ id: string; wallet?: string }>()
  const insets   = useSafeAreaInsets()
  const router   = useRouter()
  const showPill = usePillStore(s => s.show)

  // walletApplied is decided on the booking screen and passed as a route param
  const walletApplied = parseInt(walletParam ?? '0', 10) || 0

  const { eventTitle, ticketPrice, platformFee, total, loading, error } = usePaymentData(id)
  const { apps: upiApps, loading: upiAppsLoading } = useInstalledUpiApps()
  const lastPackageName = useLastPaymentStore(s => s.lastPackageName)
  const setLastPackageName = useLastPaymentStore(s => s.setLastPackageName)
  const recommendedApp =
    upiApps.find(a => a.package_name === lastPackageName) ??
    upiApps.find(a => /google ?pay|gpay/i.test(a.app_name)) ??
    upiApps[0]

  const [paying, setPaying]         = useState(false)
  const [payingMsg, setPayingMsg]   = useState('Processing…')
  const [upiSheetOpen, setUpiSheetOpen] = useState(false)
  const [rzpKey, setRzpKey]         = useState('')
  const [showWalletAnim, setShowWalletAnim] = useState(false)
  const [failedMsg, setFailedMsg]   = useState<string | null>(null)
  const [billExpanded, setBillExpanded] = useState(false)

  const amountToPay = Math.max(0, total - walletApplied)

  useEffect(() => {
    if (error) { showPill(error, 'error'); router.back() }
  }, [error])

  // Fetch public key early so UpiIdSheet can init Razorpay for VPA validation
  useEffect(() => {
    ApiService.getPaymentPublicKey()
      .then(r => setRzpKey(r.key))
      .catch(() => {})
  }, [])

  // ── Full wallet payment ──────────────────────────────────────────────────

  const doWalletPay = async () => {
    if (!id || paying) return
    setPaying(true)
    setPayingMsg('Processing…')
    try {
      await ApiService.walletPay(id)
      hSuccess()
      if (walletApplied > 0) {
        // paying must clear here or the "processing" screen would keep
        // taking render priority over the wallet success overlay below.
        setPaying(false)
        setShowWalletAnim(true)
        // Navigate happens inside PaymentWalletSuccessOverlay's onDone
      } else {
        router.replace(`/(events)/${id}/ticket` as any)
      }
    } catch (err: any) {
      showPill(err?.detail ?? 'Payment failed. Try again.', 'error')
      setPaying(false)
    }
  }

  const afterWalletAnim = () => {
    router.replace(`/(events)/${id}/ticket` as any)
  }

  // ── Shared post-payment verification ─────────────────────────────────────

  const finalise = async (data: any) => {
    await ApiService.verifyPayment({
      event_id: id!,
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
      wallet_amount: walletApplied,
    })
    hSuccess()
    if (walletApplied > 0) {
      setPaying(false)
      setShowWalletAnim(true)
    } else {
      router.replace(`/(events)/${id}/ticket` as any)
    }
  }

  // ── Fetch order helper ───────────────────────────────────────────────────

  const fetchOrder = async () => {
    const order = await ApiService.createPaymentOrder(id!, walletApplied)
    if (order.full_wallet) { await doWalletPay(); return null }
    if (!order.order_id || !order.razorpay_key || !order.amount) {
      setFailedMsg('Could not initialise payment. Please try again.')
      setPaying(false)
      return null
    }
    return order
  }

  // ── UPI intent ───────────────────────────────────────────────────────────

  const handleUpiApp = async (packageName: string) => {
    if (!id || paying) return
    hTap()
    if (amountToPay === 0) { await doWalletPay(); return }
    setPaying(true)
    setPayingMsg('Opening UPI app…')
    try {
      const order = await fetchOrder()
      if (!order) return
      const data: any = await RazorpayCustomUI.open({
        key_id: order.razorpay_key,
        order_id: order.order_id,
        amount: String((order.amount ?? 0) * 100),
        currency: 'INR',
        name: 'Gorave',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'intent',
        upi_app_package_name: packageName,
        contact: order.contact ?? '',
        email: order.email ?? '',
      })
      await finalise(data)
      setLastPackageName(packageName)
    } catch (err: any) {
      setFailedMsg(err?.code === 0 ? 'Payment was cancelled.' : (err?.description ?? err?.detail ?? 'Payment failed. Please try again.'))
      setPaying(false)
    }
  }

  // ── UPI collect ──────────────────────────────────────────────────────────

  const handleUpiCollect = async (vpa: string) => {
    if (!id || paying) return
    setUpiSheetOpen(false)
    if (amountToPay === 0) { await doWalletPay(); return }
    setPaying(true)
    setPayingMsg('Check your UPI app to approve…')
    try {
      const order = await fetchOrder()
      if (!order) return
      const data: any = await RazorpayCustomUI.open({
        key_id: order.razorpay_key,
        order_id: order.order_id,
        amount: String((order.amount ?? 0) * 100),
        currency: 'INR',
        name: 'Gorave',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'collect',
        '_[vpa]': vpa,
        contact: order.contact ?? '',
        email: order.email ?? '',
      })
      await finalise(data)
    } catch (err: any) {
      setFailedMsg(err?.code === 0 ? 'Payment was cancelled.' : (err?.description ?? err?.detail ?? 'UPI collect failed. Please try again.'))
      setPaying(false)
    }
  }

  // ── QR code ──────────────────────────────────────────────────────────────

  const handleQrPress = async () => {
    if (paying) return
    hTap()
    setPaying(true)
    setPayingMsg('Generating QR code…')
    try {
      const res = await ApiService.createQrPayment(id!, walletApplied)
      router.push({
        pathname: `/(events)/${id}/qr-payment` as any,
        params: {
          wallet: String(walletApplied),
          qr_id: res.qr_id,
          purl: res.payment_url,
          iurl: res.image_url,
          amount: String(res.amount_inr),
          exp: res.expires_at,
          etitle: eventTitle ?? '',
        },
      })
      setPaying(false)
    } catch (err: any) {
      const detail = err?.detail ?? err?.message ?? ''
      if (detail.toLowerCase().includes('unavailable') || detail.toLowerCase().includes('busy') || detail.toLowerCase().includes('try again')) {
        showPill('Please try again in a few minutes.', 'error')
      } else {
        showPill(detail || 'Could not generate QR code. Please try again.', 'error')
      }
      setPaying(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (showWalletAnim) {
    return <PaymentWalletSuccessOverlay amount={walletApplied} onDone={afterWalletAnim} />
  }

  if (paying) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
        <Text style={s.payingMsg}>{payingMsg}</Text>
      </View>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <PaymentOrderSummary
          eventTitle={eventTitle}
          ticketPrice={ticketPrice}
          platformFee={platformFee}
          amountToPay={amountToPay}
          walletApplied={walletApplied}
          expanded={billExpanded}
          onToggle={() => setBillExpanded(v => !v)}
        />

        <PaymentMethodSelector
          amountToPay={amountToPay}
          upiApps={upiApps}
          upiAppsLoading={upiAppsLoading}
          recommendedApp={recommendedApp}
          paying={paying}
          onWalletPay={doWalletPay}
          onUpiApp={handleUpiApp}
          onQrPress={handleQrPress}
          onEnterUpiId={() => setUpiSheetOpen(true)}
        />

        <View style={s.secureRow}>
          <CheckCircle size={13} color={Colors.inkDisabled} strokeWidth={1.6} />
          <Text style={s.secureText}>Secure payment · Instant wallet refund if event is cancelled in your Gorave Wallet</Text>
        </View>
      </ScrollView>

      <UpiIdSheet
        visible={upiSheetOpen}
        rzpKey={rzpKey}
        onPay={handleUpiCollect}
        onClose={() => setUpiSheetOpen(false)}
      />

      <PaymentFailedSheet
        visible={failedMsg !== null}
        message={failedMsg ?? undefined}
        onRetry={() => setFailedMsg(null)}
        onBack={() => { setFailedMsg(null); router.back() }}
      />
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

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  secureText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'center' },

  payingMsg: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})

import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Image,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming,
} from 'react-native-reanimated'
import RazorpayCustomUI from 'react-native-customui'
import {
  ArrowLeft, ChevronRight, Wallet, CheckCircle, QrCode,
} from 'lucide-react-native'
import { Colors, FontFamily, PLATFORM_FEE_PERCENT_LABEL } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { usePaymentData } from '@/hooks/usePaymentData'
import { useInstalledUpiApps } from '@/hooks/useInstalledUpiApps'
import { UpiIdSheet } from '@/components/UpiIdSheet'
import { PaymentFailedSheet } from '@/components/PaymentFailedSheet'

// ── Wallet success overlay ────────────────────────────────────────────────────

const P_COLORS = ['#FF6B35', '#FF3864', '#00C48C', '#FFB830', '#FF6B35', '#00C48C', '#FF3864', '#FFB830']

function Particle({ index }: { index: number }) {
  const angle = (index / 8) * Math.PI * 2
  const dist  = 80 + (index % 3) * 20
  const pX  = useSharedValue(0)
  const pY  = useSharedValue(0)
  const pOp = useSharedValue(0)

  useEffect(() => {
    pX.value  = withDelay(80, withSpring(Math.cos(angle) * dist, { damping: 12 }))
    pY.value  = withDelay(80, withSpring(Math.sin(angle) * dist, { damping: 12 }))
    pOp.value = withDelay(80, withTiming(1, { duration: 150 }))
    setTimeout(() => { pOp.value = withTiming(0, { duration: 400 }) }, 1000)
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: pX.value }, { translateY: pY.value }],
    opacity: pOp.value,
  }))

  return <Animated.View style={[ov.particle, { backgroundColor: P_COLORS[index] }, style]} />
}

function WalletSuccessOverlay({ amount, onDone }: { amount: number; onDone: () => void }) {
  const scale   = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [])

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={ov.root}>
      <View style={ov.center}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <Particle key={i} index={i} />)}
        <Animated.View style={[ov.circle, circleStyle]}>
          <Wallet size={36} color="#fff" strokeWidth={2} />
        </Animated.View>
        <Text style={ov.label}>₹{amount} from Vybe Wallet</Text>
        <Text style={ov.sub}>applied to your booking</Text>
      </View>
    </View>
  )
}

const ov = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  center: { alignItems: 'center', justifyContent: 'center' },
  circle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  label: { fontFamily: FontFamily.headingBold, fontSize: 22, color: '#fff', textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  particle: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
})

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const { id, wallet: walletParam } = useLocalSearchParams<{ id: string; wallet?: string }>()
  const insets   = useSafeAreaInsets()
  const router   = useRouter()
  const showPill = usePillStore(s => s.show)

  // walletApplied is decided on the booking screen and passed as a route param
  const walletApplied = parseInt(walletParam ?? '0', 10) || 0

  const { eventTitle, ticketPrice, platformFee, total, loading, error } = usePaymentData(id)
  const { apps: upiApps, loading: upiAppsLoading } = useInstalledUpiApps()

  const [paying, setPaying]         = useState(false)
  const [payingMsg, setPayingMsg]   = useState('Processing…')
  const [upiSheetOpen, setUpiSheetOpen] = useState(false)
  const [rzpKey, setRzpKey]         = useState('')
  const [showWalletAnim, setShowWalletAnim] = useState(false)
  const [failedMsg, setFailedMsg]   = useState<string | null>(null)
  const [qrGenerating, setQrGenerating] = useState(false)

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
        setShowWalletAnim(true)
        // Navigate happens inside WalletSuccessOverlay's onDone
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
        name: 'Vybe',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'intent',
        upi_app_package_name: packageName,
        contact: order.contact ?? '',
        email: order.email ?? '',
      })
      await finalise(data)
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
        name: 'Vybe',
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

  // ── Card / Net Banking ───────────────────────────────────────────────────

  // const handleCard = async () => {
  //   if (!id || paying) return
  //   hTap()
  //   if (amountToPay === 0) { await doWalletPay(); return }
  //   setPaying(true)
  //   setPayingMsg('Preparing payment…')
  //   try {
  //     const order = await fetchOrder()
  //     if (!order) return
  //     const data = await RazorpayCheckout.open({
  //       key: order.razorpay_key,
  //       amount: String(order.amount * 100),
  //       currency: 'INR',
  //       name: 'Vybe',
  //       description: eventTitle,
  //       order_id: order.order_id,
  //       prefill: { contact: order.contact ?? '', email: order.email ?? '' },
  //       theme: { color: '#FF6B35' },
  //     })
  //     await finalise(data)
  //   } catch (err: any) {
  //     setFailedMsg(err?.code === 0 ? 'Payment was cancelled.' : (err?.description ?? err?.detail ?? 'Payment failed. Please try again.'))
  //     setPaying(false)
  //   }
  // }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

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
      {showWalletAnim && (
        <WalletSuccessOverlay amount={walletApplied} onDone={afterWalletAnim} />
      )}

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
        {/* Bill summary */}
        <View style={s.billCard}>
          <Text style={s.billTitle} numberOfLines={1}>{eventTitle}</Text>
          <BillRow label="Ticket price" value={`₹${ticketPrice}`} />
          <BillRow label={`Platform fee (${PLATFORM_FEE_PERCENT_LABEL})`} value={`₹${platformFee}`} />
          {walletApplied > 0 && <BillRow label="Vybe Wallet applied" value={`-₹${walletApplied}`} green />}
          <View style={s.billDivider} />
          <View style={s.billTotalRow}>
            <Text style={s.billTotalLabel}>To Pay</Text>
            <LinearGradient colors={['#FF6B35', '#FF3864']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.billTotalBadge}>
              <Text style={s.billTotalValue}>₹{amountToPay}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Wallet banner — if wallet was applied on booking screen */}
        {walletApplied > 0 && (
          <View style={s.walletBanner}>
            <Wallet size={16} color={Colors.brandOrange} strokeWidth={1.8} />
            <Text style={s.walletBannerText}>₹{walletApplied} from Vybe Wallet will be used</Text>
          </View>
        )}

        {amountToPay === 0 ? (
          /* Full wallet */
          <Pressable style={s.walletOnlyBtn} onPress={doWalletPay}>
            <LinearGradient colors={['#FF6B35', '#FF3864']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.walletOnlyGradient}>
              <Wallet size={18} color="#fff" strokeWidth={2} />
              <Text style={s.walletOnlyText}>PAY WITH WALLET</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <>
            {/* UPI */}
            <View style={s.upiSectionRow}>
              <Image
                source={require('../../../../assets/images/payments/upiLogo.png')}
                style={s.upiLogoImg}
                resizeMode="contain"
              />
              <Text style={s.sectionLabel}>Pay with UPI</Text>
            </View>
            <View style={s.methodCard}>
              {upiAppsLoading ? (
                <View style={s.upiLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.inkDisabled} />
                </View>
              ) : upiApps.length === 0 ? (
                <View style={s.upiEmptyRow}>
                  <Text style={s.upiEmptyText}>No UPI apps found on device</Text>
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
                        source={{ uri: (app.app_icon.startsWith('http') || app.app_icon.startsWith('file:') || app.app_icon.startsWith('/'))
                          ? app.app_icon
                          : `data:image/png;base64,${app.app_icon}`
                        }}
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
                style={[s.methodRow, s.methodTopBorder]}
                onPress={async () => {
                  if (qrGenerating) return
                  hTap()
                  setQrGenerating(true)
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
                  } catch (err: any) {
                    const detail = err?.detail ?? err?.message ?? ''
                    if (detail.toLowerCase().includes('unavailable') || detail.toLowerCase().includes('busy') || detail.toLowerCase().includes('try again')) {
                      showPill('Please try again in a few minutes.', 'error')
                    } else {
                      showPill(detail || 'Could not generate QR code. Please try again.', 'error')
                    }
                  } finally {
                    setQrGenerating(false)
                  }
                }}
                disabled={qrGenerating}
              >
                <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
                  {qrGenerating
                    ? <ActivityIndicator size="small" color={Colors.brandOrange} />
                    : <QrCode size={18} color={Colors.inkSecondary} strokeWidth={2} />
                  }
                </View>
                <Text style={s.methodLabel}>{qrGenerating ? 'Generating QR…' : 'Pay via QR Code'}</Text>
                {!qrGenerating && <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />}
              </Pressable>
              <Pressable
                style={[s.methodRow, s.methodTopBorder]}
                onPress={() => { hTap(); setUpiSheetOpen(true) }}
              >
                <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
                  <Text style={[s.dotText, { color: Colors.inkSecondary, fontSize: 14 }]}>@</Text>
                </View>
                <Text style={s.methodLabel}>Other / Enter UPI ID</Text>
                <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
              </Pressable>
            </View>

            {/* Cards */}
            {/* <Text style={s.sectionLabel}>CARDS & NET BANKING</Text>
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
            </View> */}
          </>
        )}

        <View style={s.secureRow}>
          <CheckCircle size={13} color={Colors.inkDisabled} strokeWidth={1.6} />
          <Text style={s.secureText}>Secure payment · Instant wallet refund if event is cancelled in your Vybe Wallet</Text>
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

  walletBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.18)', paddingHorizontal: 14, paddingVertical: 10 },
  walletBannerText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandOrange, flex: 1 },

  sectionLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, letterSpacing: 0.1, color: Colors.inkSecondary, marginLeft: 4 },
  upiSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4, marginTop: 4 },
  upiLogoImg: { height: 28, width: 54 },

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

  walletOnlyBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 8 },
  walletOnlyGradient: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  walletOnlyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.8 },

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  secureText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'center' },

  payingMsg: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})

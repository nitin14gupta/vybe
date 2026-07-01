import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, Image,
  Alert, ActivityIndicator, BackHandler, ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import * as Notifications from 'expo-notifications'
import { ArrowLeft, CheckCircle } from 'lucide-react-native'
import QRCode from 'react-native-qrcode-svg'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { useImageShare } from '@/hooks/useImageShare'
import { PrimaryButton, OutlineButton } from '@/components/ui'

type Status = 'loading' | 'active' | 'paid' | 'expired' | 'error'

// ── Paid animation ────────────────────────────────────────────────────────────

function PaidOverlay() {
  const scale   = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={po.root}>
      <Animated.View style={[po.circle, style]}>
        <CheckCircle size={48} color="#fff" strokeWidth={2} />
      </Animated.View>
      <Text style={po.label}>Payment Confirmed!</Text>
      <Text style={po.sub}>Taking you to your ticket…</Text>
    </View>
  )
}

const po = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 50 },
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accentGreen, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, marginTop: 8 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary },
})

// ── Screen ────────────────────────────────────────────────────────────────────

export default function QrPaymentScreen() {
  const {
    id, wallet: walletParam,
    qr_id: qrIdParam, purl, iurl, amount, exp, etitle,
  } = useLocalSearchParams<{
    id: string; wallet?: string
    qr_id?: string; purl?: string; iurl?: string
    amount?: string; exp?: string; etitle?: string
  }>()
  const insets      = useSafeAreaInsets()
  const router      = useRouter()
  const showPill    = usePillStore(s => s.show)
  const { shareImage } = useImageShare()
  const walletApplied = parseInt(walletParam ?? '0', 10) || 0

  const [status, setStatus]         = useState<Status>('loading')
  const [qrId, setQrId]             = useState('')
  const [imageUrl, setImageUrl]     = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')  // UPI string for QRCode svg
  const [amountInr, setAmountInr]   = useState(0)
  const [expiresAt, setExpiresAt]   = useState<Date | null>(null)
  const [timeLeft, setTimeLeft]     = useState(0)
  const [verifying, setVerifying]   = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [eventTitle, setEventTitle] = useState(etitle ?? '')

  const statusRef  = useRef<Status>('loading')
  statusRef.current = status
  const qrCardRef  = useRef<View>(null)

  // ── Load QR on mount (skip if pre-loaded from params) ─────────────────────

  const loadQr = async () => {
    setStatus('loading')
    try {
      const res = await ApiService.createQrPayment(id!, walletApplied)
      setQrId(res.qr_id)
      setImageUrl(res.image_url)
      setPaymentUrl(res.payment_url ?? '')
      setAmountInr(res.amount_inr)
      setExpiresAt(new Date(res.expires_at))
      setStatus('active')
    } catch (err: any) {
      const detail = err?.detail ?? err?.message ?? ''
      if (detail.toLowerCase().includes('unavailable') || detail.toLowerCase().includes('busy') || detail.toLowerCase().includes('try again')) {
        showPill('Razorpay is currently busy. Please try again in a few minutes.', 'error')
      } else {
        showPill(detail || 'Could not generate QR. Try again.', 'error')
      }
      setStatus('error')
    }
  }

  useEffect(() => {
    if (qrIdParam) {
      // Pre-loaded from payment screen — initialize directly without an API call
      setQrId(qrIdParam)
      setImageUrl(iurl ?? '')
      setPaymentUrl(purl ?? '')
      setAmountInr(parseInt(amount ?? '0', 10) || 0)
      setExpiresAt(exp ? new Date(exp) : null)
      setEventTitle(etitle ?? '')
      setStatus('active')
    } else {
      loadQr()
    }
  }, [])

  // ── Countdown ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!expiresAt || status !== 'active') return
    const tick = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) { setStatus('expired'); clearInterval(tick) }
    }, 1000)
    return () => clearInterval(tick)
  }, [expiresAt, status])

  // ── Push notification listener ─────────────────────────────────────────────

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(n => {
      const d = n.request.content.data as any
      if (d?.type === 'payment_success' && d?.event_id === id) {
        setStatus('paid')
        hSuccess()
        setTimeout(() => router.replace(`/(events)/${id}/ticket` as any), 1600)
      }
    })
    return () => sub.remove()
  }, [id])

  // ── Back intercept ─────────────────────────────────────────────────────────

  const confirmBack = () => {
    const s = statusRef.current
    if (s === 'paid' || s === 'loading' || s === 'error') { router.back(); return }
    Alert.alert(
      'Leave payment?',
      'Your QR code is still active. If you leave, the payment may not be tracked.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave anyway', style: 'destructive', onPress: () => router.back() },
      ]
    )
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const s = statusRef.current
      if (s === 'paid' || s === 'loading' || s === 'error') return false
      confirmBack()
      return true
    })
    return () => sub.remove()
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const timerColor = timeLeft < 30 ? '#FF3864' : timeLeft < 120 ? Colors.brandOrange : Colors.accentGreen

  const handleManualCheck = async () => {
    if (verifying) return
    hTap()
    setVerifying(true)
    try {
      const res = await ApiService.getQrStatus(qrId)
      if (res.status === 'paid') {
        setStatus('paid'); hSuccess()
        setTimeout(() => router.replace(`/(events)/${id}/ticket` as any), 1600)
      } else if (res.status === 'expired') {
        setStatus('expired')
      } else {
        showPill('Payment not received yet. Please complete the payment first.', 'default')
      }
    } catch {
      showPill('Could not check payment status.', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const handleShare = async () => {
    hTap()
    if (!paymentUrl && !imageUrl) return
    const name = eventTitle || 'the event'
    const message = `Pay ₹${amountInr} for ${name}.\n\nScan using any UPI app — GPay, PhonePe, Paytm, BHIM and more.\n\nValid for 15 minutes.`
    const result = await shareImage(qrCardRef, { message })
    if (!result.shared && result.error === 'failed') {
      showPill('Could not share QR code.', 'error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'paid') return <PaidOverlay />

  const isActive  = status === 'active'
  const isExpired = status === 'expired'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={confirmBack} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Pay via QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading */}
      {status === 'loading' && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brandOrange} />
          <Text style={s.hintText}>Generating QR code…</Text>
        </View>
      )}

      {/* Error */}
      {status === 'error' && (
        <View style={s.center}>
          <Text style={s.hintText}>Could not generate QR code.</Text>
          <View style={{ width: 200, marginTop: 16 }}>
            <PrimaryButton label="Try Again" onPress={loadQr} />
          </View>
        </View>
      )}

      {/* Active / Expired */}
      {(isActive || isExpired) && (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* QR card — ref used to capture image for sharing */}
            <View style={s.card} ref={qrCardRef} collapsable={false}>
              <Text style={s.toPayLabel}>TO PAY</Text>
              <Text style={s.amount}>₹{amountInr}</Text>

              <View style={[s.qrWrap, isExpired && s.qrWrapExpired]}>
                {paymentUrl ? (
                  // Clean QR generated from UPI payment string — no Razorpay branding
                  <View style={s.qrSvgWrap}>
                    <QRCode
                      value={paymentUrl}
                      size={220}
                      color="#000000"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                ) : imageUrl ? (
                  // Fallback: crop Razorpay branded image to show just the QR code area
                  <View style={s.qrCropContainer}>
                    {imgLoading && (
                      <ActivityIndicator
                        style={StyleSheet.absoluteFill}
                        color={Colors.inkDisabled}
                      />
                    )}
                    <Image
                      source={{ uri: imageUrl }}
                      style={s.qrCropImage}
                      resizeMode="stretch"
                      onLoadStart={() => setImgLoading(true)}
                      onLoad={() => setImgLoading(false)}
                      onError={() => setImgLoading(false)}
                    />
                  </View>
                ) : (
                  <View style={s.qrPlaceholder}>
                    <ActivityIndicator color={Colors.inkDisabled} />
                  </View>
                )}
                {isExpired && (
                  <View style={s.expiredOverlay}>
                    <Text style={s.expiredOverlayText}>QR Expired</Text>
                  </View>
                )}
              </View>

              <Text style={s.scanHint}>Scan and pay using any UPI app</Text>
            </View>

            {/* Countdown */}
            {isActive && (
              <Text style={[s.countdown, { color: timerColor }]}>
                QR code is valid for{' '}
                <Text style={[s.countdownBold, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
              </Text>
            )}
            {isExpired && (
              <Text style={[s.countdown, { color: Colors.inkDisabled }]}>QR code has expired</Text>
            )}

            <Text style={s.disclaimer}>
              Share this QR code only with trusted individuals, not publicly or with strangers. You are responsible for who you allow to pay.
            </Text>
          </ScrollView>

          {/* Footer — wrap buttons in sized Views so flex works on Pressable children */}
          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            {isActive ? (
              <>
                <View style={{ flex: 1 }}>
                  <OutlineButton
                    label={verifying ? 'Checking…' : "I've Paid"}
                    onPress={handleManualCheck}
                    disabled={verifying}
                  />
                </View>
                <View style={{ flex: 1.4 }}>
                  <PrimaryButton label="Share QR Code" onPress={handleShare} />
                </View>
              </>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <OutlineButton label="Go Back" onPress={() => router.back()} />
                </View>
                <View style={{ flex: 1.4 }}>
                  <PrimaryButton label="New QR Code" onPress={loadQr} />
                </View>
              </>
            )}
          </View>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },

  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', gap: 14 },
  toPayLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, letterSpacing: 1.5, color: Colors.inkSecondary },
  amount: { fontFamily: FontFamily.headingBold, fontSize: 36, color: Colors.inkPrimary },

  qrWrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' },
  qrWrapExpired: { opacity: 0.35 },

  // Clean QR from react-native-qrcode-svg (paymentUrl available)
  qrSvgWrap: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 10 },

  // Crop fallback: show only the QR code portion of Razorpay's branded image.
  // Razorpay template is approx portrait ~3:4 ratio; the QR code lives in the
  // upper-center 40% of the image. We scale up and clip to zoom into that area.
  qrCropContainer: { width: 240, height: 240, overflow: 'hidden', alignItems: 'center', backgroundColor: '#fff' },
  qrCropImage: { width: 350, height: 440, marginTop: -80 },

  qrPlaceholder: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated },
  expiredOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  expiredOverlayText: { fontFamily: FontFamily.headingBold, fontSize: 22, color: '#fff' },

  scanHint: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },

  countdown: { fontFamily: FontFamily.bodyMedium, fontSize: 15, textAlign: 'center' },
  countdownBold: { fontFamily: FontFamily.headingBold, fontSize: 15 },

  disclaimer: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'center', lineHeight: 18, paddingHorizontal: 4 },

  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },

  hintText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})

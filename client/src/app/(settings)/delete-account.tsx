import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, AlertTriangle, Trash2, ShieldOff,
  Wallet, Calendar, MessageCircle, CheckCircle2,
} from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import ApiService from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'

const TOTAL_STEPS = 4

// What the user loses — shown in step 2
const LOSSES = [
  { icon: Calendar,       text: 'All your event bookings and tickets' },
  { icon: Wallet,         text: 'Any remaining Vybe Wallet credits' },
  { icon: MessageCircle,  text: 'All conversations and connections' },
  { icon: ShieldOff,      text: 'Your profile, photos and voice intro' },
]

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[dot.dot, i + 1 === current && dot.active]} />
      ))}
    </View>
  )
}

const dot = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 28 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.divider },
  active: { width: 20, backgroundColor: Colors.brandCoral },
})

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DeleteAccountScreen() {
  const insets   = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const clearAuth = useAuthStore(s => s.clearAuth)

  const [step, setStep]         = useState(1)
  const [otpSent, setOtpSent]   = useState(false)
  const [otp, setOtp]           = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [typed, setTyped]       = useState('')

  const shakeAnim = useRef(new Animated.Value(0)).current

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const phone = useAuthStore(s => s.phone ?? '')

  // Send OTP to their registered phone
  const handleSendOtp = async () => {
    if (otpLoading) return
    hTap()
    setOtpLoading(true)
    try {
      await ApiService.sendOTP(phone)
      setOtpSent(true)
    } catch {
      showPill('Could not send OTP. Please try again.', 'error')
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify OTP — we just need a valid OTP call (it doesn't log them in fresh)
  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || otpLoading) return
    hTap()
    setOtpLoading(true)
    try {
      await ApiService.verifyOTP(phone, otp)
      hSuccess()
      setOtpVerified(true)
      setStep(4)
    } catch {
      shake()
      showPill('Invalid OTP. Please check and try again.', 'error')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleDelete = async () => {
    if (typed !== 'DELETE' || deleting) return
    hTap()
    setDeleting(true)
    try {
      await ApiService.deleteAccount()
      hSuccess()
      clearAuth()
      router.replace('/(auth)/phone' as any)
    } catch {
      showPill('Could not delete account. Please contact support@vybe.in', 'error')
      setDeleting(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepDots current={step} />

        {/* ── Step 1: Warning ─────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <View style={s.iconCircle}>
              <AlertTriangle size={36} color={Colors.brandCoral} strokeWidth={1.8} />
            </View>
            <Text style={s.title}>Are you sure?</Text>
            <Text style={s.body}>
              Deleting your account is permanent. Your profile, photos, events, and Vybe Wallet credits will be removed within 30 days.
            </Text>
            <Text style={s.bodySecond}>
              If you change your mind within 30 days, contact{' '}
              <Text style={s.link}>support@vybe.in</Text>
              {' '}with your registered phone number and we'll restore your account.
            </Text>

            <View style={s.spacer} />

            <Pressable style={s.btnDestructive} onPress={() => { hTap(); setStep(2) }}>
              <Text style={s.btnDestructiveText}>Continue</Text>
            </Pressable>
            <Pressable style={s.btnSecondary} onPress={() => router.back()}>
              <Text style={s.btnSecondaryText}>Keep My Account</Text>
            </Pressable>
          </>
        )}

        {/* ── Step 2: What you'll lose ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <View style={s.iconCircle}>
              <Trash2 size={36} color={Colors.brandCoral} strokeWidth={1.8} />
            </View>
            <Text style={s.title}>What you'll lose</Text>
            <Text style={s.body}>
              Everything linked to your account will be permanently deleted:
            </Text>

            <View style={s.lossCard}>
              {LOSSES.map(({ icon: Icon, text }, i) => (
                <View key={i} style={[s.lossRow, i < LOSSES.length - 1 && s.lossBorder]}>
                  <View style={s.lossIcon}>
                    <Icon size={16} color={Colors.brandCoral} strokeWidth={1.8} />
                  </View>
                  <Text style={s.lossText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={s.spacer} />

            <Pressable style={s.btnDestructive} onPress={() => { hTap(); setStep(3) }}>
              <Text style={s.btnDestructiveText}>I understand, continue</Text>
            </Pressable>
            <Pressable style={s.btnSecondary} onPress={() => router.back()}>
              <Text style={s.btnSecondaryText}>Keep My Account</Text>
            </Pressable>
          </>
        )}

        {/* ── Step 3: Verify phone ─────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <View style={s.iconCircle}>
              <CheckCircle2 size={36} color={Colors.brandOrange} strokeWidth={1.8} />
            </View>
            <Text style={s.title}>Verify it's you</Text>
            <Text style={s.body}>
              We'll send a one-time code to{' '}
              <Text style={s.phoneHighlight}>+91 {phone}</Text>
              {' '}to confirm this is really you.
            </Text>

            {!otpSent ? (
              <Pressable style={s.btnOrange} onPress={handleSendOtp} disabled={otpLoading}>
                {otpLoading
                  ? <ActivityIndicator color="#111" />
                  : <Text style={s.btnOrangeText}>Send OTP</Text>
                }
              </Pressable>
            ) : (
              <>
                <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                  <TextInput
                    style={s.otpInput}
                    value={otp}
                    onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    placeholderTextColor={Colors.inkDisabled}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </Animated.View>
                <Pressable
                  style={[s.btnOrange, otp.length !== 6 && s.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 6 || otpLoading}
                >
                  {otpLoading
                    ? <ActivityIndicator color="#111" />
                    : <Text style={s.btnOrangeText}>Verify OTP</Text>
                  }
                </Pressable>
                <Pressable style={s.resendBtn} onPress={handleSendOtp} disabled={otpLoading}>
                  <Text style={s.resendText}>Resend code</Text>
                </Pressable>
              </>
            )}

            <Pressable style={[s.btnSecondary, { marginTop: 12 }]} onPress={() => router.back()}>
              <Text style={s.btnSecondaryText}>Cancel</Text>
            </Pressable>
          </>
        )}

        {/* ── Step 4: Final confirmation ───────────────────────────────────── */}
        {step === 4 && (
          <>
            <View style={[s.iconCircle, s.iconCircleRed]}>
              <Trash2 size={36} color={Colors.brandCoral} strokeWidth={1.8} />
            </View>
            <Text style={s.title}>Final step</Text>
            <Text style={s.body}>
              Type <Text style={s.deleteWord}>DELETE</Text> below to permanently delete your account. This cannot be undone.
            </Text>

            <TextInput
              style={s.typeInput}
              value={typed}
              onChangeText={v => setTyped(v.toUpperCase())}
              placeholder="Type DELETE here"
              placeholderTextColor={Colors.inkDisabled}
              autoCapitalize="characters"
              maxLength={6}
            />

            <Pressable
              style={[s.btnFinalDelete, typed !== 'DELETE' && s.btnDisabled]}
              onPress={handleDelete}
              disabled={typed !== 'DELETE' || deleting}
            >
              {deleting
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Trash2 size={16} color="#fff" strokeWidth={2} />
                    <Text style={s.btnFinalDeleteText}>Delete My Account</Text>
                  </>
                )
              }
            </Pressable>
            <Pressable style={s.btnSecondary} onPress={() => router.back()}>
              <Text style={s.btnSecondaryText}>Cancel</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },

  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 20, gap: 0 },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,56,100,0.1)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  iconCircleRed: { backgroundColor: 'rgba(255,56,100,0.15)' },

  title: {
    fontFamily: FontFamily.headingBold, fontSize: 26, letterSpacing: -0.5,
    color: Colors.inkPrimary, textAlign: 'center', marginBottom: 14,
  },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  bodySecond: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled,
    textAlign: 'center', lineHeight: 21,
  },
  link: { color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium },
  phoneHighlight: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  deleteWord: { fontFamily: FontFamily.headingBold, color: Colors.brandCoral },

  spacer: { height: 24 },

  lossCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.divider,
    overflow: 'hidden', marginTop: 8,
  },
  lossRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  lossBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  lossIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,56,100,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  lossText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, flex: 1 },

  otpInput: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.divider, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary,
    textAlign: 'center', letterSpacing: 12, marginBottom: 16, marginTop: 8,
  },
  typeInput: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,56,100,0.4)', paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.brandCoral,
    textAlign: 'center', letterSpacing: 4, marginBottom: 24, marginTop: 8,
  },

  btnDestructive: {
    height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,56,100,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,56,100,0.3)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  btnDestructiveText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.brandCoral },

  btnFinalDelete: {
    height: 56, borderRadius: 28,
    backgroundColor: Colors.brandCoral,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 10,
  },
  btnFinalDeleteText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff' },

  btnOrange: {
    height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 10,
  },
  btnOrangeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },

  btnSecondary: {
    height: 48, borderRadius: 24,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecondaryText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },

  btnDisabled: { opacity: 0.4 },

  resendBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 4 },
  resendText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },
})

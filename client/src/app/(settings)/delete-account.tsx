import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  View, Text, StyleSheet, TextInput,
  ScrollView, ActivityIndicator, Pressable,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft, AlertTriangle, Trash2, ShieldOff,
  Wallet, Calendar, MessageCircle, CheckCircle2, Users,
} from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import {
  AppHeader, HeaderIconBtn,
  PrimaryButton, OutlineButton, OTPInput,
} from '@/components/ui'
import ApiService from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { isEventPast } from '@/lib/dates'
import { useCountdown } from '@/hooks/useCountdown'

const TOTAL_STEPS = 4

const LOSSES = [
  { icon: Calendar,       text: 'All your event bookings and tickets' },
  { icon: Wallet,         text: 'Any remaining Gorave Wallet credits' },
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

  const [step, setStep]               = useState(1)
  const [otpSent, setOtpSent]         = useState(false)
  const [otp, setOtp]                 = useState('')
  const [otpError, setOtpError]       = useState(false)
  const [otpLoading, setOtpLoading]   = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [typed, setTyped]             = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState(0)
  const [checkingEvents, setCheckingEvents] = useState(true)
  const { seconds: resendSeconds, isExpired: canResend, reset: resetResendTimer } = useCountdown(45)

  useFocusEffect(
    useCallback(() => {
      setCheckingEvents(true)
      ApiService.getMyHostedEvents()
        .then(events => {
          // Only count events that haven't ended yet (upcoming or currently
          // in progress) — cancelled and past/ended events don't block deletion.
          const blocking = events.filter(e => !e.is_cancelled && !isEventPast(e))
          setUpcomingEvents(blocking.length)
        })
        .catch(() => {})
        .finally(() => setCheckingEvents(false))
    }, [])
  )

  const rawPhone    = useAuthStore(s => s.phone ?? '')
  const maskedPhone = `+91 ******${rawPhone.slice(-4)}`

  const handleSendOtp = async () => {
    if (otpLoading) return
    hTap()
    setOtpLoading(true)
    try {
      await ApiService.sendOTP(rawPhone)
      setOtpSent(true)
      setOtp('')
      setOtpError(false)
      resetResendTimer()
    } catch {
      showPill('Could not send OTP. Please try again.', 'error')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || otpLoading) return
    hTap()
    setOtpLoading(true)
    setOtpError(false)
    try {
      await ApiService.verifyOTP(rawPhone, otp)
      hSuccess()
      setOtpVerified(true)
      setStep(4)
    } catch {
      setOtpError(true)
      setOtp('')
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

  const backAction = (
    <HeaderIconBtn onPress={() => router.back()}>
      <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
    </HeaderIconBtn>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (checkingEvents) {
    return (
      <View style={s.root}>
        <AppHeader title="Delete Account" leftAction={backAction} />
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      </View>
    )
  }

  // ── Blocked: has upcoming hosted events ───────────────────────────────────
  if (upcomingEvents > 0) {
    return (
      <View style={s.root}>
        <AppHeader title="Delete Account" leftAction={backAction} />
        <View style={s.center}>
          <View style={s.blockerIconWrap}>
            <Users size={38} color={Colors.brandOrange} strokeWidth={1.8} />
          </View>
          <Text style={s.blockerTitle}>
            You have {upcomingEvents} upcoming hosted event{upcomingEvents > 1 ? 's' : ''}
          </Text>
          <Text style={s.blockerBody}>
            You can't delete your account while you have upcoming events as a host. Cancel your events first, then come back.
          </Text>
          <View style={s.blockerBtns}>
            <PrimaryButton
              label="Go to My Events"
              onPress={() => router.push('/(settings)/my-events' as any)}
            />
            <OutlineButton
              label="Back"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <AppHeader title="Delete Account" leftAction={backAction} />

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
              Deleting your account is permanent. Your profile, photos, events, and Gorave Wallet credits will be removed within 30 days.
            </Text>
            <Text style={s.bodySecond}>
              If you change your mind within 30 days, contact{' '}
              <Text style={s.link}>support@vybe.in</Text>
              {' '}with your registered phone number and we'll restore your account.
            </Text>

            <View style={s.spacer} />

            <PrimaryButton label="Continue" onPress={() => { hTap(); setStep(2) }} />
            <OutlineButton label="Keep My Account" onPress={() => router.back()} style={s.secondaryBtn} />
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

            <PrimaryButton label="I understand, continue" onPress={() => { hTap(); setStep(3) }} />
            <OutlineButton label="Keep My Account" onPress={() => router.back()} style={s.secondaryBtn} />
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
              <Text style={s.phoneHighlight}>{maskedPhone}</Text>
              {' '}to confirm this is really you.
            </Text>

            {!otpSent ? (
              <PrimaryButton
                label="Send OTP"
                onPress={handleSendOtp}
                loading={otpLoading}
                style={s.otpBtn}
              />
            ) : (
              <>
                <View style={s.otpInputWrap}>
                  <OTPInput
                    value={otp}
                    onChange={v => { setOtp(v); setOtpError(false) }}
                    error={otpError}
                    autoFocus
                  />
                </View>

                <View style={s.resendArea}>
                  {!canResend ? (
                    <Text style={s.resendCountdown}>
                      Resend code in <Text style={s.resendCountdownTimer}>0:{String(resendSeconds).padStart(2, '0')}</Text>
                    </Text>
                  ) : (
                    <Pressable onPress={() => { hTap(); handleSendOtp() }} disabled={otpLoading}>
                      <Text style={s.resendLink}>Resend code</Text>
                    </Pressable>
                  )}
                </View>

                <PrimaryButton
                  label="Verify OTP"
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 6}
                  loading={otpLoading}
                  style={s.otpBtn}
                />
              </>
            )}

            <OutlineButton label="Cancel" onPress={() => router.back()} style={s.secondaryBtn} />
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

            <View style={s.finalDeleteBtn}>
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <OutlineButton
                  label="Delete My Account"
                  onPress={handleDelete}
                  disabled={typed !== 'DELETE'}
                  style={s.destructiveOutline}
                />
              )}
            </View>

            <OutlineButton label="Cancel" onPress={() => router.back()} style={s.secondaryBtn} />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 20 },

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

  otpInputWrap: { marginTop: 8 },
  resendArea: { alignItems: 'center', marginTop: 20 },
  resendCountdown: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  resendCountdownTimer: { fontFamily: FontFamily.bodySemiBold, color: 'rgba(255,107,53,0.75)' },
  resendLink: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },
  typeInput: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,56,100,0.4)', paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.brandCoral,
    textAlign: 'center', letterSpacing: 4, marginBottom: 16, marginTop: 8,
  },

  secondaryBtn: { marginTop: 10 },
  otpBtn: { marginTop: 12 },

  finalDeleteBtn: { marginBottom: 4 },
  destructiveOutline: {
    borderColor: 'rgba(255,56,100,0.5)',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding, gap: 12 },

  blockerIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  blockerTitle: {
    fontFamily: FontFamily.headingBold, fontSize: 22, letterSpacing: -0.3,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  blockerBody: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  blockerBtns: { alignSelf: 'stretch', gap: 10 },
})

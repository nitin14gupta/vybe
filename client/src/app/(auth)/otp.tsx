import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Pencil } from 'lucide-react-native'
import { BackButton, OTPInput, PrimaryButton, Screen, KeyboardAvoidingWrapper } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [attempts, setAttempts] = useState(0)
  const tooManyAttempts = attempts >= 3
  const { handleVerifyOTP, handleSendOTP } = useAuth()
  const { seconds, isExpired, reset } = useCountdown(45)

  const isComplete = code.length === 6

  const handleVerify = async () => {
    if (!isComplete || tooManyAttempts) return
    setLoading(true)
    setError(false)
    setErrorMsg('')
    try {
      const result = await handleVerifyOTP(phone, code)
      if (result.profileComplete) {
        router.replace('/(tabs)/')
      } else {
        router.replace('/(auth)/age-gate')
      }
    } catch (e: any) {
      const next = attempts + 1
      setAttempts(next)
      setError(true)
      if (next >= 3) {
        setErrorMsg('Too many attempts — request a new code.')
      } else {
        setErrorMsg(e?.response?.data?.detail || 'Incorrect code. Try again.')
      }
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await handleSendOTP(phone)
      reset()
      setAttempts(0)
      setError(false)
      setErrorMsg('')
    } catch {}
  }

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <KeyboardAvoidingWrapper>
        <View style={styles.inner}>
          <Text style={styles.title}>Enter the code</Text>
          <View style={styles.sentRow}>
            <Text style={styles.sentText}>Sent to +91 {phone}</Text>
            <Pressable onPress={() => router.back()}>
              <Pencil size={14} color={Colors.brandOrange} strokeWidth={2} />
            </Pressable>
          </View>

          <OTPInput
            value={code}
            onChange={setCode}
            error={error}
            autoFocus
          />

          {errorMsg ? (
            <Text style={styles.errorMsg}>{errorMsg}</Text>
          ) : null}

          <View style={styles.resendArea}>
            {!isExpired ? (
              <Text style={styles.countdown}>
                Resend code in{' '}
                <Text style={styles.countdownTimer}>
                  0:{String(seconds).padStart(2, '0')}
                </Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend}>
                <Text style={styles.resendBtn}>Resend code</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Continue"
            onPress={handleVerify}
            disabled={!isComplete || tooManyAttempts}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </Screen>
  )
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 20,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    letterSpacing: -0.28,
    color: Colors.inkPrimary,
    marginBottom: 8,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 38,
  },
  sentText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  errorMsg: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.brandCoral,
    marginTop: 12,
  },
  resendArea: {
    marginTop: 28,
    alignItems: 'center',
  },
  countdown: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  countdownTimer: {
    fontFamily: FontFamily.bodySemiBold,
    color: 'rgba(255,107,53,0.75)',
  },
  resendBtn: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.brandOrange,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
})

import { View, Text, Pressable, StyleSheet } from 'react-native'
import { CheckCircle2 } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton, OutlineButton, OTPInput } from '@/components/ui'
import { hTap } from '@/lib/haptics'

interface Props {
  maskedPhone: string
  otpSent: boolean
  otp: string
  otpError: boolean
  otpLoading: boolean
  canResend: boolean
  resendSeconds: number
  onOtpChange: (v: string) => void
  onSendOtp: () => void
  onVerifyOtp: () => void
  onCancel: () => void
}

export function DeleteOtpStep({
  maskedPhone, otpSent, otp, otpError, otpLoading, canResend, resendSeconds,
  onOtpChange, onSendOtp, onVerifyOtp, onCancel,
}: Props) {
  return (
    <>
      <View style={styles.iconCircle}>
        <CheckCircle2 size={36} color={Colors.inkPrimary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Verify it's you</Text>
      <Text style={styles.body}>
        We'll send a one-time code to{' '}
        <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
        {' '}to confirm this is really you.
      </Text>

      {!otpSent ? (
        <PrimaryButton
          label="Send OTP"
          onPress={onSendOtp}
          loading={otpLoading}
          style={styles.otpBtn}
        />
      ) : (
        <>
          <View style={styles.otpInputWrap}>
            <OTPInput
              value={otp}
              onChange={v => onOtpChange(v)}
              error={otpError}
              autoFocus
            />
          </View>

          <View style={styles.resendArea}>
            {!canResend ? (
              <Text style={styles.resendCountdown}>
                Resend code in <Text style={styles.resendCountdownTimer}>0:{String(resendSeconds).padStart(2, '0')}</Text>
              </Text>
            ) : (
              <Pressable onPress={() => { hTap(); onSendOtp() }} disabled={otpLoading}>
                <Text style={styles.resendLink}>Resend code</Text>
              </Pressable>
            )}
          </View>

          <PrimaryButton
            label="Verify OTP"
            onPress={onVerifyOtp}
            disabled={otp.length !== 6}
            loading={otpLoading}
            style={styles.otpBtn}
          />
        </>
      )}

      <OutlineButton label="Cancel" onPress={onCancel} style={styles.secondaryBtn} />
    </>
  )
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.1),
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: {
    fontFamily: FontFamily.headingBold, fontSize: 26, letterSpacing: -0.5,
    color: Colors.inkPrimary, textAlign: 'center', marginBottom: 14,
  },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  phoneHighlight: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  secondaryBtn: { marginTop: 10 },
  otpBtn: { marginTop: 12 },

  otpInputWrap: { marginTop: 8 },
  resendArea: { alignItems: 'center', marginTop: 20 },
  resendCountdown: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  resendCountdownTimer: { fontFamily: FontFamily.bodySemiBold, color: withOpacity(Colors.inkPrimary, 0.75) },
  resendLink: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})

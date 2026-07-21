import { useState } from 'react'
import { View, Text, StyleSheet, Keyboard } from 'react-native'
import { router } from 'expo-router'
import { BackButton, PhoneInput, PrimaryButton, KeyboardAvoidingWrapper, InAppBrowserModal, LogoMark } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Colors, FontFamily, Spacing, TERMS_URL, PRIVACY_URL } from '@/constants'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PhoneScreen() {
  const [phone, setPhone]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [legalUrl, setLegalUrl]     = useState<string | null>(null)
  const { handleSendOTP }           = useAuth()
  const insets                      = useSafeAreaInsets()
  const isValid                     = phone.length === 10

  const handleContinue = async () => {
    if (!isValid) return
    Keyboard.dismiss()
    setLoading(true)
    setError('')
    try {
      await handleSendOTP(phone)
      router.push({ pathname: '/(auth)/otp', params: { phone } })
    } catch {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LiquidPlasmaBackground />
      <View style={styles.topRow}>
        <BackButton transparent onPress={() => router.back()} />
        <LogoMark size={20} opacity={0.7} style={styles.topLogo} />
      </View>
      <KeyboardAvoidingWrapper transparent>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>What's your number?</Text>
            <Text style={styles.subtitle}>We'll send a one-time code</Text>
          </View>
          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            error={error}
            autoFocus
          />
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            label="Send Code"
            onPress={handleContinue}
            disabled={!isValid}
            loading={loading}
          />
          <Text style={styles.legal}>
            By clicking Send Code, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => setLegalUrl(TERMS_URL)}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={() => setLegalUrl(PRIVACY_URL)}>Privacy Policy</Text>
            {' '}and consent to receive event texts from Gorave. Msg frequency varies; data rates may apply.
            {' '}For help, email us at support@gorave.com.
          </Text>
        </View>
      </KeyboardAvoidingWrapper>

      <InAppBrowserModal
        visible={legalUrl !== null}
        url={legalUrl}
        onClose={() => setLegalUrl(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLogo: {
    marginRight: Spacing.screenPadding,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 20,
  },
  header: {
    marginBottom: 34,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    letterSpacing: -0.28,
    color: Colors.inkPrimary,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  legal: {
    textAlign: 'center',
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.inkDisabled,
    marginTop: 14,
    lineHeight: 16,
  },
  legalLink: {
    color: Colors.inkSecondary,
  },
})

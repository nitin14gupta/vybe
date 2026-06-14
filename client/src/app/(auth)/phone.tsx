import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { BackButton, PhoneInput, PrimaryButton, KeyboardAvoidingWrapper } from '@/components/ui'
import { useAuthStore } from '@/store/auth'
import { useAuth } from '@/hooks/useAuth'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function PhoneScreen() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { handleSendOTP } = useAuth()
  const setAuthPhone = useAuthStore(s => s.setAuth)

  const isValid = phone.length === 10

  const handleContinue = async () => {
    if (!isValid) return
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
    <View style={styles.container}>
      <BackButton onPress={() => router.back()} />
      <KeyboardAvoidingWrapper>
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
            label="Continue"
            onPress={handleContinue}
            disabled={!isValid}
            loading={loading}
          />
          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' '}&amp;{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>
      </KeyboardAvoidingWrapper>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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

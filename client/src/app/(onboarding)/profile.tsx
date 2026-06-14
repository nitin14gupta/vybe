import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { BackButton, Input, GenderSelector, ProgressBar, PrimaryButton } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'
import { createProfile } from '@/api/user'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function ProfileScreen() {
  const store = useOnboardingStore()
  const accessToken = useAuthStore(s => s.accessToken)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canProceed = !!store.name.trim() && !!store.dob && !!store.gender

  const handleNext = async () => {
    if (!canProceed) return
    setLoading(true)
    setError('')
    try {
      await createProfile({
        name: store.name.trim(),
        dob: store.dob,
        gender: store.gender,
      })
      router.push('/(onboarding)/photos')
    } catch (e: any) {
      if (e?.response?.status === 400) {
        setError(e.response.data.detail || 'You must be 18+ to use Vybe.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={1} />
      <View style={styles.header}>
        <Text style={styles.title}>Let's set up your profile</Text>
        <Text style={styles.subtitle}>Tell us a little about yourself</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Full Name"
          placeholder="Rohan Sharma"
          value={store.name}
          onChangeText={v => store.setField('name', v)}
        />
        <Input
          label="Date of Birth"
          placeholder="DD / MM / YYYY"
          value={store.dob}
          onChangeText={v => store.setField('dob', v)}
          style={styles.field}
        />
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>GENDER</Text>
          <GenderSelector
            value={store.gender}
            onChange={v => store.setField('gender', v)}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Next"
          onPress={handleNext}
          disabled={!canProceed}
          loading={loading}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 12 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    letterSpacing: -0.24,
    color: Colors.inkPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.screenPadding, paddingTop: 8 },
  field: { marginTop: Spacing.sectionGap },
  fieldLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginBottom: 6,
  },
  error: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.brandCoral,
    marginTop: 12,
  },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
})

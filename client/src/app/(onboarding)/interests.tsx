import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { BackButton, ProgressBar, InterestChip, PrimaryButton } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { setInterests } from '@/api/user'
import { INTERESTS } from '@/constants/onboarding'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function InterestsScreen() {
  const store = useOnboardingStore()
  const [loading, setLoading] = useState(false)

  const canProceed = store.interests.length >= 3
  const remaining = Math.max(0, 3 - store.interests.length)

  const toggle = (label: string) => {
    const current = store.interests
    if (current.includes(label)) {
      store.setField('interests', current.filter(x => x !== label))
    } else {
      store.setField('interests', [...current, label])
    }
  }

  const handleNext = async () => {
    if (!canProceed) return
    setLoading(true)
    try {
      await setInterests(store.interests)
      router.push('/(onboarding)/location')
    } catch {
      router.push('/(onboarding)/location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={4} />
      <View style={styles.header}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick at least 3 — helps us find your vibe
          {store.interests.length > 0 && (
            <Text style={canProceed ? styles.countReady : styles.count}>
              {' '}· {store.interests.length} selected
            </Text>
          )}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.chips}
        showsVerticalScrollIndicator={false}
      >
        {INTERESTS.map(([label, emoji]) => (
          <InterestChip
            key={label}
            label={label}
            emoji={emoji}
            selected={store.interests.includes(label)}
            onPress={() => toggle(label)}
          />
        ))}
        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        {!canProceed && (
          <Text style={styles.hint}>
            Select {remaining} more to continue
          </Text>
        )}
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
  count: { color: Colors.inkSecondary },
  countReady: { color: Colors.brandOrange },
  scroll: { flex: 1 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
  },
  spacer: { width: '100%', height: 12 },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
  hint: {
    textAlign: 'center',
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginBottom: 10,
  },
})

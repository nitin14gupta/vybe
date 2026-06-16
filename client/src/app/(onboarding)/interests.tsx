import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { BackButton, ProgressBar, InterestChip, PrimaryButton, Screen } from '@/components/ui'
import { useInterests } from '@/hooks/useInterests'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function InterestsScreen() {
  const { availableInterests, loadingList, selected, atMax, canProceed, remaining, loading, toggle, handleNext } = useInterests()

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={4} />

      <View style={styles.header}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick 3–4 interests that define your vibe
          {selected.length > 0 && (
            <Text style={canProceed ? styles.countReady : styles.count}>
              {' '}· {selected.length}/4
            </Text>
          )}
        </Text>
        {atMax && (
          <Text style={styles.maxHint}>Max 4 reached — deselect one to swap</Text>
        )}
      </View>

      {loadingList ? (
        <View style={styles.listLoader}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.chips}
          showsVerticalScrollIndicator={false}
        >
          {availableInterests.map(({ name, emoji }) => (
            <InterestChip
              key={name}
              label={name}
              emoji={emoji}
              selected={selected.includes(name)}
              onPress={() => toggle(name)}
            />
          ))}
          <View style={styles.spacer} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        {!canProceed && !atMax && (
          <Text style={styles.hint}>Select {remaining} more to continue</Text>
        )}
        <PrimaryButton
          label="Next"
          onPress={handleNext}
          disabled={!canProceed}
          loading={loading}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
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
  maxHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.accentGold,
    marginTop: 6,
  },
  listLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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

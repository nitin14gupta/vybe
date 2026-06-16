import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { Screen, BackButton } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0'
  const buildNumber = Constants.expoConfig?.android?.versionCode ?? '1'

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>About Vybe</Text>
        <View style={styles.headerEnd} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <Text style={styles.wordmark}>VYBE</Text>
          <Text style={styles.tagline}>Meet. Vibe. Connect.</Text>
          <Text style={styles.version}>Version {version} ({buildNumber})</Text>
        </View>

        {/* Info cards */}
        <View style={styles.card}>
          <InfoRow label="Built for" value="Gen-Z India" />
          <View style={styles.divider} />
          <InfoRow label="Made with" value="Expo + React Native" />
          <View style={styles.divider} />
          <InfoRow label="Contact" value="hello@vybe.in" />
        </View>

        <Text style={styles.madeWith}>
          Made with ❤️ in India
        </Text>
      </ScrollView>
    </Screen>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.screenPadding,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  headerEnd: { width: 40 },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 24,
  },
  logoBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  wordmark: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 52,
    color: Colors.brandOrange,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    letterSpacing: 0.5,
  },
  version: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    width: '100%',
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  infoLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  infoValue: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 16,
  },
  madeWith: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
  },
})

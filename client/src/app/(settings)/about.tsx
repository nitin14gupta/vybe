import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { ArrowLeft, ChevronRight } from 'lucide-react-native'
import { Screen, AppHeader, HeaderIconBtn, LogoMark } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0'
  const buildNumber = Constants.expoConfig?.android?.versionCode ?? '1'

  return (
    <Screen top={false}>
      <AppHeader
        title="About Vybe"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <LogoMark size={48} style={{ marginBottom: 4 }} />
          <Text style={styles.wordmark}>VYBE</Text>
          <Text style={styles.tagline}>Meet. Vybe. Connect.</Text>
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

        {/* Legal */}
        <View style={styles.card}>
          <InfoRow label="Privacy Policy" value="" onPress={() => router.push('/(settings)/privacy')} />
          <View style={styles.divider} />
          <InfoRow label="Terms of Use" value="" onPress={() => router.push('/(settings)/terms')} />
          <View style={styles.divider} />
          <InfoRow label="Open Source Licenses" value="" onPress={() => router.push('/(settings)/open-source' as any)} />
        </View>

        <Text style={styles.madeWith}>
          Made with ❤️ in India
        </Text>
      </ScrollView>
    </Screen>
  )
}

function InfoRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable style={styles.infoRow} onPress={onPress}>
        <Text style={styles.infoLabel}>{label}</Text>
        <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
      </Pressable>
    )
  }
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
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

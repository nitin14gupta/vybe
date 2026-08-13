import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ChevronRight, Copy, Heart } from 'lucide-react-native'
import { Screen, AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, LogoMark, BrandingFooter } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius, SUPPORT_EMAIL, APP_VERSION, APP_BUILD_NUMBER } from '@/constants'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { usePillStore } from '@/store/pillStore'
import { hTap } from '@/lib/haptics'

export default function AboutScreen() {
  const version = APP_VERSION
  const buildNumber = APP_BUILD_NUMBER
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const showPill = usePillStore(s => s.show)

  return (
    <Screen top={false}>
      <AppHeader
        title="About Gorave"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <LogoMark size={48} style={{ marginBottom: 4 }} />
          <Text style={styles.wordmark}>GORAVE</Text>
          <Text style={styles.tagline}>Meet. Vibe. Connect.</Text>
          <Text style={styles.version}>Version {version} ({buildNumber})</Text>
        </View>

        {/* Info cards */}
        <View style={styles.card}>
          <InfoRow label="Built for" value="Gen-Z India" />
          <View style={styles.divider} />
          <InfoRow label="Made with" value="Expo + React Native" />
          <View style={styles.divider} />
          <InfoRow
            label="Contact"
            value={SUPPORT_EMAIL}
            icon="copy"
            onPress={async () => {
              hTap()
              await Clipboard.setStringAsync(SUPPORT_EMAIL)
              showPill('Email copied', 'default')
            }}
          />
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <InfoRow label="Privacy Policy" value="" onPress={() => router.push('/(settings)/privacy')} />
          <View style={styles.divider} />
          <InfoRow label="Terms of Use" value="" onPress={() => router.push('/(settings)/terms')} />
        </View>

        <BrandingFooter style={styles.footer} />
      </ScrollView>
    </Screen>
  )
}

function InfoRow({ label, value, onPress, icon = 'chevron' }: {
  label: string
  value: string
  onPress?: () => void
  icon?: 'chevron' | 'copy'
}) {
  if (onPress) {
    return (
      <Pressable style={styles.infoRow} onPress={onPress}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.infoRowRight}>
          {!!value && <Text style={styles.infoValue}>{value}</Text>}
          {icon === 'copy'
            ? <Copy size={15} color={Colors.inkDisabled} strokeWidth={2} />
            : <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />}
        </View>
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
    color: Colors.inkPrimary,
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
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  footer: {
    marginTop: 4,
  },
})

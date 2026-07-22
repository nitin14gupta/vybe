import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { ShieldCheck } from 'lucide-react-native'
import { OutlineButton, PrimaryButton, Screen } from '@/components/ui'
import { Colors, FontFamily, Spacing } from '@/constants'
import { HostBackdrop, HostProgressBar, StepIcon } from '@/components/host-onboarding'

export default function HostVerifiedGuestsScreen() {
  return (
    <Screen transparent>
      <HostBackdrop />
      <HostProgressBar step={3} total={4} />

      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.content}>
          <StepIcon>
            <ShieldCheck size={38} color={Colors.brandOrange} strokeWidth={1.8} />
          </StepIcon>
          <Text style={styles.title}>Know who's actually coming</Text>
          <Text style={styles.subtitle}>
            Every guest signs up with phone verification and a real profile — fewer no-shows, safer events.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.nextBtn}>
          <PrimaryButton label="Continue" onPress={() => { hTap(); router.push('/(host-onboarding)/payout-details') }} />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  content: { alignItems: 'center' },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 27,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },
})

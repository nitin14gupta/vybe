import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Screen, BackButton } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function PrivacyScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.headerEnd} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.updated}>Last updated: June 2025</Text>

          <ContentSection title="Information We Collect">
            We collect information you provide directly — like your name, phone number, photos, voice intro, and interests — when you create and use your Vybe profile. We also collect your approximate location when you grant permission.
          </ContentSection>

          <ContentSection title="How We Use It">
            Your information helps us show you relevant people and events nearby, personalize your feed, and keep Vybe safe. We never sell your personal data to third parties.
          </ContentSection>

          <ContentSection title="Photos & Voice">
            Your photos and voice intro are stored securely and displayed only to other Vybe users. You can delete them at any time from your profile settings.
          </ContentSection>

          <ContentSection title="Data Retention">
            You can delete your account at any time from Settings → Delete Account. After verifying your identity, your profile, photos, voice intro, and wallet credits are permanently removed within 30 days. If you change your mind, email privacy@vybe.in within 30 days.
          </ContentSection>

          <ContentSection title="Contact">
            Questions? Reach us at privacy@vybe.in
          </ContentSection>
        </View>
      </ScrollView>
    </Screen>
  )
}

function ContentSection({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
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
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 20,
    gap: 20,
  },
  updated: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
  },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 22,
  },
})

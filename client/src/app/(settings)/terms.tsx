import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Screen, BackButton } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function TermsScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Terms of Use</Text>
        <View style={styles.headerEnd} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.updated}>Last updated: June 2025</Text>

          <ContentSection title="Acceptance">
            By using Vybe you agree to these terms. If you don't agree, please don't use the app.
          </ContentSection>

          <ContentSection title="Eligibility">
            You must be 18 or older to use Vybe. We reserve the right to terminate accounts that violate this rule.
          </ContentSection>

          <ContentSection title="Your Content">
            You own the photos, voice intros, and content you post. By posting, you grant Vybe a license to display that content to other users within the app.
          </ContentSection>

          <ContentSection title="Prohibited Conduct">
            Don't impersonate others, post illegal content, harass other users, or attempt to reverse-engineer the app. Violations result in immediate account termination.
          </ContentSection>

          <ContentSection title="Limitation of Liability">
            Vybe is provided as-is. We are not liable for any damages arising from your use of the app beyond what's required by applicable Indian law.
          </ContentSection>

          <ContentSection title="Changes">
            We may update these terms occasionally. Continued use of Vybe after updates means you accept the new terms.
          </ContentSection>

          <ContentSection title="Contact">
            Questions? Email us at legal@vybe.in
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

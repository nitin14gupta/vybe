import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Screen, BackButton } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Who can see my profile?',
    a: 'Other Vybe users can see your profile, photos, interests, and voice intro. Your phone number is never shown.',
  },
  {
    q: 'How do I change my city?',
    a: 'Go to Edit Profile → tap "Change" next to your city. You can search or use GPS to auto-detect.',
  },
  {
    q: 'Can I delete my photos?',
    a: 'Yes — go to Edit Profile and tap any photo to remove it.',
  },
  {
    q: 'How does voice intro work?',
    a: 'Record up to 30 seconds introducing yourself. Other users can play it from your profile.',
  },
  {
    q: 'What are Vibers and Vibing?',
    a: 'Vibers are people who follow you. Vibing is the people you follow. It\'s our Gen-Z take on followers/following.',
  },
  {
    q: 'How do I report someone?',
    a: 'Long-press on a profile and select "Report". We review all reports within 24 hours.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Email us at support@vybe.in with your registered phone number and we\'ll delete your account within 7 days.',
  },
]

export default function HelpScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Help &amp; FAQ</Text>
        <View style={styles.headerEnd} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {FAQS.map((faq, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.question}>{faq.q}</Text>
            <Text style={styles.answer}>{faq.a}</Text>
          </View>
        ))}

        <Text style={styles.contact}>
          Still stuck? Email support@vybe.in — we reply within 24 hours.
        </Text>
      </ScrollView>
    </Screen>
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
    gap: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 16,
    gap: 6,
  },
  question: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  answer: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 21,
  },
  contact: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: 'center',
    marginTop: 8,
  },
})

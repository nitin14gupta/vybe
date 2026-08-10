import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Screen, AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { Colors, FontFamily, Spacing, Radius, SUPPORT_EMAIL } from '@/constants'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Who can see my profile?',
    a: 'Other Gorave users can see your profile, photos, interests, and voice intro. Your phone number is never shown.',
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
    a: `Go to Settings → Delete Account. You'll verify your phone number via OTP, then type DELETE to confirm. Your account is removed within 30 days. Changed your mind? Email ${SUPPORT_EMAIL} within 30 days.`,
  },
]

export default function HelpScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top

  return (
    <Screen top={false}>
      <AppHeader
        title="Help & FAQ"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {FAQS.map((faq, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.question}>{faq.q}</Text>
            <Text style={styles.answer}>{faq.a}</Text>
          </View>
        ))}

        <Text style={styles.contact}>
          Still stuck? Email {SUPPORT_EMAIL} — we reply within 24 hours.
        </Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
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

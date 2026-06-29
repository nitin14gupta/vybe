import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Colors, FontFamily, Radius } from '@/constants'

// ── Content ───────────────────────────────────────────────────────────────────

const TERMS_SECTIONS = [
  {
    title: 'Acceptance',
    body: 'By using Vybe you agree to these terms. If you don\'t agree, please don\'t use the app.',
  },
  {
    title: 'Eligibility',
    body: 'You must be 18 or older to use Vybe. We reserve the right to terminate accounts that violate this rule.',
  },
  {
    title: 'Your Content',
    body: 'You own the photos, voice intros, and content you post. By posting, you grant Vybe a licence to display that content to other users within the app.',
  },
  {
    title: 'Prohibited Conduct',
    body: 'Don\'t impersonate others, post illegal content, harass other users, or attempt to reverse-engineer the app. Violations result in immediate account termination.',
  },
  {
    title: 'Payments',
    body: 'Event ticket purchases are final. Wallet credits are issued when events are cancelled and can only be used on future Vybe events. They are not purchasable and are not subject to Apple In-App Purchase rules.',
  },
  {
    title: 'Limitation of Liability',
    body: 'Vybe is provided as-is. We are not liable for any damages arising from your use of the app beyond what is required by applicable Indian law.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms occasionally. Continued use of Vybe after updates means you accept the new terms.',
  },
  {
    title: 'Contact',
    body: 'Questions? Email us at legal@vybe.in',
  },
]

const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide — like your name, phone number, photos, voice intro, and interests — when you create and use your Vybe profile. We also collect your approximate location when you grant permission.',
  },
  {
    title: 'How We Use It',
    body: 'Your information helps us show you relevant people and events nearby, personalise your feed, and keep Vybe safe. We never sell your personal data to third parties.',
  },
  {
    title: 'Photos & Voice',
    body: 'Your photos and voice intro are stored securely and displayed only to other Vybe users. You can delete them at any time from your profile settings.',
  },
  {
    title: 'Data Retention',
    body: 'You can delete your account at any time from Settings → Delete Account. Your profile, photos, voice intro, and wallet credits are permanently removed within 30 days. Email privacy@vybe.in within 30 days to recover.',
  },
  {
    title: 'Contact',
    body: 'Questions? Reach us at privacy@vybe.in',
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────

export type LegalType = 'terms' | 'privacy'

interface Props {
  visible: boolean
  type: LegalType
  onClose: () => void
}

// ── Backdrop ──────────────────────────────────────────────────────────────────

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.6}
    />
  )
}

// ── Core (always mounted so ref works) ────────────────────────────────────────

function LegalSheetCore({ type, onClose }: Omit<Props, 'visible'>) {
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => { ref.current?.present() }, [])

  const title   = type === 'terms' ? 'Terms of Use' : 'Privacy Policy'
  const updated = 'Last updated: June 2025'
  const sections = type === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['66%']}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>{title}</Text>
        <Text style={s.updated}>{updated}</Text>

        {sections.map((sec, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function LegalSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <LegalSheetCore {...rest} />
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48, gap: 20 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    marginBottom: 2,
  },
  updated: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    marginBottom: 4,
  },
  section: { gap: 5 },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  sectionBody: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 21,
  },
})

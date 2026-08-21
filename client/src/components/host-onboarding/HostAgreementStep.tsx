import { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { PenLine, Check } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { Colors, FontFamily } from '@/constants'

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'You set the tone for your event',
    body: "As a host, you're responsible for the safety and conduct of everyone at your event, not just your own. Screen your guest list where you can, and step in if something feels wrong.",
  },
  {
    title: 'Zero tolerance for harassment',
    body: 'Confirmed harassment at an event you host — by you or a guest you failed to act on — can result in your host privileges being revoked and your account suspended.',
  },
  {
    title: 'False reports are a violation too',
    body: "Using a harassment report to settle a personal dispute, or knowingly filing one that's false, is also a violation and can result in account action.",
  },
  {
    title: 'Follow local laws',
    body: "Age restrictions, capacity limits, noise ordinances, alcohol and venue rules — you're responsible for knowing and following what applies to your event.",
  },
  {
    title: "It's on you, not just Gorave",
    body: "Gorave connects you with attendees; it doesn't supervise your event in person. You're the one running it.",
  },
]

interface Props {
  onSignatureChange?: (uri: string | null) => void
}

export function HostAgreementStep({ onSignatureChange }: Props) {
  const signatureUri = useSignatureCaptureStore(s => s.uri)
  const { height: winHeight } = useWindowDimensions()

  useEffect(() => {
    onSignatureChange?.(signatureUri)
  }, [signatureUri])

  const openSheet = () => { hTap(); router.push('/(host-onboarding)/signature-sheet') }

  return (
    <View style={s.content}>
      <Text style={s.title}>Host Agreement</Text>
      <Text style={s.subtitle}>A few extra responsibilities come with hosting — please read and sign below.</Text>

      <View style={s.sections}>
        {SECTIONS.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>

      {signatureUri ? (
        <Pressable style={[s.signedBox, { height: winHeight * 0.45 }]} onPress={openSheet}>
          <Image source={{ uri: signatureUri }} style={s.signaturePreview} contentFit="contain" />
          <View style={s.signedBadge}>
            <Check size={12} color={Colors.background} strokeWidth={3} />
          </View>
        </Pressable>
      ) : (
        <Pressable style={s.signButton} onPress={openSheet}>
          <PenLine size={18} color={Colors.background} strokeWidth={1.8} />
          <Text style={s.signButtonText}>Sign</Text>
        </Pressable>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  content: { alignItems: 'center' },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  sections: { width: '100%', gap: 14, marginBottom: 20 },
  section: { gap: 3 },
  sectionTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14.5, color: Colors.inkPrimary },
  sectionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18.5 },
  signButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', height: 50,
    backgroundColor: Colors.inkPrimary,
    borderRadius: 25,
    borderCurve: 'continuous',
  },
  signButtonText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.background },
  signedBox: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  signaturePreview: { width: '100%', height: '100%' },
  signedBadge: {
    position: 'absolute', top: 14, right: 14,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
  },
})

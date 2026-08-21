import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check, ShieldCheck } from 'lucide-react-native'
import { hTap, hSuccess } from '@/lib/haptics'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Colors, FontFamily, withOpacity } from '@/constants'

const SNAP_POINTS = ['82%']

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Respect every person',
    body: "Treat hosts, attendees, and everyone you meet through Gorave with respect. Harassment, unwanted contact, discrimination, or any form of abuse — in person or through the app — isn't tolerated.",
  },
  {
    title: 'Zero tolerance for harassment',
    body: "Reports of harassment are reviewed by our team. Confirmed violations can result in an account being suspended or permanently banned, and may be reported to local authorities where appropriate.",
  },
  {
    title: 'False reports are a violation too',
    body: 'Knowingly filing a false or malicious report against someone else is also a violation of this agreement and can result in account action. Our goal is a safe community for everyone, including the person you report.',
  },
  {
    title: 'Your safety tools are a backup, not a substitute',
    body: "Emergency Contacts and SOS exist to help you stay safe, but they don't replace your own judgment. Meet in public where you can, tell someone you trust your plans, and trust your instincts.",
  },
  {
    title: "You're responsible for your own conduct",
    body: "You're responsible for how you behave at every event you attend or host, and for following local laws — age restrictions, venue rules, and anything else that applies. Gorave connects people; it doesn't supervise events in person.",
  },
  {
    title: 'Report what you see',
    body: "Use the in-app Report or Block feature for any incident, big or small. If anyone is in immediate danger, contact local emergency services first.",
  },
]

interface Props {
  visible: boolean
  onAgree: () => Promise<boolean> | boolean
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.7} />
}

function SafetyAgreementSheetCore({ onAgree, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets()
  const sheetRef = useRef<BottomSheetModal>(null)
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleAgree = async () => {
    if (!checked || submitting) return
    setSubmitting(true)
    const ok = await onAgree()
    setSubmitting(false)
    if (ok) {
      hSuccess()
      sheetRef.current?.dismiss()
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={0}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      {/* Scroll area gets a real flex height (not just content padding), so
          the footer below sits in normal document flow — never floating
          on top of and obscuring the last paragraph like an absolutely
          positioned footer with a guessed padding would. */}
      <View style={s.body}>
        <BottomSheetScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View style={s.headerIcon}>
              <ShieldCheck size={24} color={Colors.accentGreen} strokeWidth={1.8} />
            </View>
            <Text style={s.title}>Community Safety Agreement</Text>
            <Text style={s.subtitle}>Please read before you continue — this is how we expect everyone on Gorave to treat each other.</Text>
          </View>

          {SECTIONS.map(section => (
            <View key={section.title} style={s.section}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <Text style={s.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </BottomSheetScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable style={s.checkboxRow} onPress={() => { hTap(); setChecked(v => !v) }} hitSlop={6}>
            <View style={[s.checkbox, checked && s.checkboxChecked]}>
              {checked && <Check size={13} color={Colors.background} strokeWidth={3} />}
            </View>
            <Text style={s.checkboxLabel}>I've read and agree to the Community Safety Agreement</Text>
          </Pressable>

          <PrimaryButton label="Agree & Continue" onPress={handleAgree} disabled={!checked} loading={submitting} />
          <Pressable style={s.notNowBtn} onPress={() => { hTap(); sheetRef.current?.dismiss() }}>
            <Text style={s.notNowText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  )
}

export function SafetyAgreementSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <SafetyAgreementSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  body: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  header: { alignItems: 'center', gap: 8, paddingBottom: 20 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: withOpacity(Colors.accentGreen, 0.12),
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary, textAlign: 'center' },
  subtitle: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13.5, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 19, maxWidth: 300,
  },
  section: { marginBottom: 18 },
  sectionTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginBottom: 4 },
  sectionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13.5, color: Colors.inkSecondary, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
    gap: 12,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, marginTop: 1,
    borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.3),
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.accentGreen, borderColor: Colors.accentGreen },
  checkboxLabel: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 13.5, color: Colors.inkPrimary, lineHeight: 19 },
  notNowBtn: { alignItems: 'center', paddingVertical: 4 },
  notNowText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
})

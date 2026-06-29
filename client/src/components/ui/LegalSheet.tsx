import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Colors, FontFamily } from '@/constants'
import { TERMS_SECTIONS, PRIVACY_SECTIONS, LEGAL_UPDATED } from '@/constants/legalContent'

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

  const title    = type === 'terms' ? 'Terms of Use' : 'Privacy Policy'
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
        <Text style={s.updated}>{LEGAL_UPDATED}</Text>

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

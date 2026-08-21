import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import DrawPad, { type DrawPadHandle } from 'expo-drawpad'
import { captureRef } from 'react-native-view-shot'
import { RotateCcw } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

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

export interface HostAgreementStepHandle {
  /** Captures the drawn signature as a local PNG file URI, or null if nothing's been drawn. */
  capture(): Promise<string | null>
}

interface Props {
  onSignedChange?: (signed: boolean) => void
}

// The signature is captured (not the individual stroke paths) via
// react-native-view-shot on the canvas's own View — same technique
// useImageShare already uses for flyer capture — so what gets uploaded is
// pixel-identical to what the host actually saw and drew.
export const HostAgreementStep = forwardRef<HostAgreementStepHandle, Props>(
  function HostAgreementStep({ onSignedChange }, ref) {
    const padRef = useRef<DrawPadHandle>(null)
    const canvasRef = useRef<View>(null)
    const [hasDrawn, setHasDrawn] = useState(false)

    useImperativeHandle(ref, () => ({
      async capture() {
        if (!hasDrawn || !canvasRef.current) return null
        try {
          return await captureRef(canvasRef, { format: 'png', quality: 1, result: 'tmpfile' })
        } catch {
          return null
        }
      },
    }), [hasDrawn])

    const handleClear = () => {
      hTap()
      padRef.current?.erase()
      setHasDrawn(false)
      onSignedChange?.(false)
    }

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

        <Text style={s.signLabel}>Sign below to agree</Text>
        <View style={s.canvasWrap}>
          {/* collapsable={false} — Android strips a plain View from the
              native tree during capture without it, leaving a blank
              screenshot (same note as useImageShare.ts). */}
          <View ref={canvasRef} style={s.canvas} collapsable={false}>
            <DrawPad
              ref={padRef}
              stroke="#181818"
              strokeWidth={2.5}
              onDrawStart={() => {
                setHasDrawn(true)
                onSignedChange?.(true)
              }}
            />
          </View>
          {!hasDrawn && (
            <Text style={s.canvasHint} pointerEvents="none">Sign here</Text>
          )}
        </View>
        <Pressable style={s.clearBtn} onPress={handleClear} hitSlop={8}>
          <RotateCcw size={13} color={Colors.inkSecondary} strokeWidth={2} />
          <Text style={s.clearText}>Clear</Text>
        </Pressable>
      </View>
    )
  },
)

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
  signLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.6,
    color: Colors.inkSecondary, textTransform: 'uppercase',
    alignSelf: 'flex-start', marginBottom: 8,
  },
  canvasWrap: { width: '100%' },
  canvas: {
    width: '100%', height: 160,
    backgroundColor: '#FAFAF8',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: withOpacity(Colors.inkPrimary, 0.12),
    overflow: 'hidden',
  },
  canvasHint: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    textAlign: 'center', textAlignVertical: 'center',
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: '#B8B4AC',
  },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end', marginTop: 10, paddingVertical: 4,
  },
  clearText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
})

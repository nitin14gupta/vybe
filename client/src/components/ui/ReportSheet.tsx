import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

const REASONS = ['Fake profile', 'Inappropriate photos', 'Harassment', 'Spam', 'Underage', 'Other']

interface Props {
  visible: boolean
  targetName: string | null
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

function ReportSheetCore({ targetName, onSubmit, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleSubmit = async () => {
    if (!selected || loading) return
    setLoading(true)
    try {
      await onSubmit(selected)
      setDone(true)
      setTimeout(() => { setDone(false); setSelected(null); onClose() }, 1500)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={s.content}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Report {targetName ?? 'User'}</Text>
            <Text style={s.subtitle}>We won't let them know you reported them.</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
          </Pressable>
        </View>

        {done ? (
          <View style={s.doneBox}>
            <Text style={s.doneIcon}>✓</Text>
            <Text style={s.doneText}>Report submitted. Thank you.</Text>
          </View>
        ) : (
          <>
            <View style={s.options}>
              {REASONS.map((reason, i) => (
                <Pressable
                  key={reason}
                  style={[s.option, i < REASONS.length - 1 && s.optionBorder]}
                  onPress={() => setSelected(reason)}
                >
                  <Text style={s.optionText}>{reason}</Text>
                  <View style={[s.radio, selected === reason && s.radioSelected]}>
                    {selected === reason && <View style={s.radioDot} />}
                  </View>
                </Pressable>
              ))}
            </View>
            <Pressable style={[s.submitBtn, !selected && s.submitBtnDisabled]} onPress={handleSubmit} disabled={!selected || loading}>
              {loading ? <ActivityIndicator color="#111" size="small" /> : <Text style={s.submitBtnText}>SUBMIT REPORT</Text>}
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ReportSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ReportSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#141414' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, marginBottom: 4 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  options: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 20 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 18 },
  optionBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  optionText: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkPrimary },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.brandOrange },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.brandOrange },
  submitBtn: { height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: '#111', letterSpacing: 1.2 },
  doneBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  doneIcon: { fontSize: 40 },
  doneText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})

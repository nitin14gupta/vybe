import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

const REASONS: { key: string; label: string }[] = [
  { key: 'fake_scam', label: 'Fake or scam' },
  { key: 'inappropriate_content', label: 'Inappropriate content' },
  { key: 'misleading_info', label: 'Misleading information' },
  { key: 'spam', label: 'Spam' },
  { key: 'dangerous_activity', label: 'Dangerous activity' },
  { key: 'other', label: 'Other' },
]

interface Props {
  visible: boolean
  eventId: string
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

function ReportEventSheetCore({ eventId, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleSubmit = async () => {
    if (!selected || loading) return
    hSuccess()
    setLoading(true)
    try {
      await ApiService.reportEvent(eventId, selected, description.trim() || undefined)
      setDone(true)
      setTimeout(() => {
        setDone(false)
        setSelected(null)
        setDescription('')
        onClose()
      }, 1500)
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 409) {
        showPill("You've already reported this event", 'default')
        onClose()
      } else {
        showPill('Failed to submit report. Try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
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
      <BottomSheetScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Report Event</Text>
            <Text style={s.subtitle}>We review all reports and take action on violations.</Text>
          </View>
          <Pressable onPress={() => { hTap(); onClose() }} hitSlop={10}>
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
                  key={reason.key}
                  style={[s.option, i < REASONS.length - 1 && s.optionBorder]}
                  onPress={() => { hSelection(); setSelected(reason.key) }}
                >
                  <Text style={s.optionText}>{reason.label}</Text>
                  <View style={[s.radio, selected === reason.key && s.radioSelected]}>
                    {selected === reason.key && <View style={s.radioDot} />}
                  </View>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={s.descInput}
              placeholder="Add details (optional)"
              placeholderTextColor={Colors.inkDisabled}
              value={description}
              onChangeText={t => setDescription(t.slice(0, 200))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{description.length}/200</Text>

            <Pressable
              style={[s.submitBtn, !selected && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!selected || loading}
            >
              {loading
                ? <ActivityIndicator color="#111" size="small" />
                : <Text style={s.submitBtnText}>Submit Report</Text>
              }
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

export function ReportEventSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ReportEventSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#141414' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, marginBottom: 4 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  options: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 18 },
  optionBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  optionText: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkPrimary },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.brandOrange },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.brandOrange },
  descInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    minHeight: 80,
    marginBottom: 4,
  },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'right', marginBottom: 20 },
  submitBtn: { height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: '#111', letterSpacing: 1.2 },
  doneBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  doneIcon: { fontSize: 40 },
  doneText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})

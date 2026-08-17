import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Keyboard } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { CheckCircle2, XCircle, X, Bookmark } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap, hSuccess } from '@/lib/haptics'
import ApiService from '@/api/apiService'
import { useVpaValidation } from '@/hooks/useVpaValidation'
import { PrimaryButton, OutlineButton } from '@/components/ui'

const SNAP_POINTS = ['66%', '82%']

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.65}
    />
  )
}

function UpiIdSheetCore({
  rzpKey,
  onPay,
  onClose,
}: {
  rzpKey: string
  onPay: (vpa: string) => void
  onClose: () => void
}) {
  const ref = useRef<BottomSheetModal>(null)
  const mountedRef = useRef(true)
  const [vpa, setVpa] = useState('')
  const [savedVpa, setSavedVpa] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { validFormat, checking, vpaResult, vpaError } = useVpaValidation(vpa, rzpKey)
  const canPay = validFormat && vpaResult !== null && !vpaError
  const isAlreadySaved = savedVpa !== null && vpa.trim() === savedVpa

  useEffect(() => { ref.current?.present() }, [])

  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => ref.current?.snapToIndex(1))
    const hide = Keyboard.addListener('keyboardDidHide', () => ref.current?.snapToIndex(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  // Load saved UPI ID on mount
  useEffect(() => {
    let cancelled = false
    ApiService.getSavedUpiId().then(saved => {
      if (cancelled) return
      if (saved?.upi_id) {
        setSavedVpa(saved.upi_id)
        setVpa(saved.upi_id)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleSaveAndPay = async () => {
    if (!canPay || !vpaResult) return
    hSuccess()
    setSaving(true)
    let savedOk = false
    try {
      await ApiService.saveUpiId(vpa.trim(), vpaResult.name)
      savedOk = true
    } catch {
      // save failed silently — still proceed with payment
    } finally {
      if (mountedRef.current) {
        if (savedOk) setSavedVpa(vpa.trim())
        setSaving(false)
      }
    }
    onPay(vpa.trim())
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.sheetHandle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={s.content}>
        <View style={s.headerRow}>
          <Text style={s.title}>Enter UPI ID</Text>
          <Pressable onPress={() => { hTap(); onClose() }} hitSlop={12}>
            <X size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={[s.inputWrap, vpaError && s.inputWrapError, vpaResult && s.inputWrapSuccess]}>
          <TextInput
            style={s.input}
            placeholder="yourname@oksbi"
            placeholderTextColor={Colors.inkDisabled}
            value={vpa}
            onChangeText={v => setVpa(v.toLowerCase().trim())}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus={!savedVpa}
            returnKeyType="done"
          />
          {isAlreadySaved && !checking && (
            <View style={s.savedChip}>
              <Bookmark size={11} color={Colors.brandOrange} strokeWidth={2} fill={Colors.brandOrange} />
              <Text style={s.savedChipText}>Saved</Text>
            </View>
          )}
          {checking && (
            <ActivityIndicator size="small" color={Colors.inkDisabled} style={s.inputIcon} />
          )}
          {!checking && vpaResult && !isAlreadySaved && (
            <CheckCircle2 size={20} color={Colors.accentGreen} strokeWidth={2} style={s.inputIcon} />
          )}
          {!checking && vpaResult && isAlreadySaved && (
            <CheckCircle2 size={20} color={Colors.accentGreen} strokeWidth={2} style={s.inputIcon} />
          )}
          {!checking && vpaError && (
            <XCircle size={20} color={Colors.brandCoral} strokeWidth={2} style={s.inputIcon} />
          )}
        </View>

        {vpaResult && (
          <View style={s.nameRow}>
            <CheckCircle2 size={13} color={Colors.accentGreen} strokeWidth={2} />
            <Text style={s.nameText}>{vpaResult.name}</Text>
          </View>
        )}
        {vpaError && (
          <Text style={s.errorText}>UPI ID not found. Please check and try again.</Text>
        )}
        {!vpaResult && !vpaError && (
          <Text style={s.hint}>e.g. name@oksbi · name@ybl · name@paytm</Text>
        )}

        {canPay && !isAlreadySaved ? (
          <View style={s.btnRow}>
            <View style={s.btnFlex1}>
              <OutlineButton label="Pay" onPress={() => { hSuccess(); onPay(vpa.trim()) }} />
            </View>
            <View style={s.btnFlex14}>
              <PrimaryButton label="Save & Pay" onPress={handleSaveAndPay} loading={saving} />
            </View>
          </View>
        ) : (
          <PrimaryButton
            label={canPay ? 'Pay' : 'Verify UPI ID first'}
            onPress={() => { if (canPay) { hSuccess(); onPay(vpa.trim()) } }}
            disabled={!canPay}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function UpiIdSheet({
  visible,
  rzpKey,
  onPay,
  onClose,
}: {
  visible: boolean
  rzpKey: string
  onPay: (vpa: string) => void
  onClose: () => void
}) {
  if (!visible) return null
  return <UpiIdSheetCore rzpKey={rzpKey} onPay={onPay} onClose={onClose} />
}

const s = StyleSheet.create({
  sheetBg: { backgroundColor: Colors.sheetBackground },
  sheetHandle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: withOpacity(Colors.inkPrimary, 0.08),
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputWrapError: { borderColor: Colors.brandCoral },
  inputWrapSuccess: { borderColor: Colors.accentGreen },
  input: { flex: 1, paddingVertical: 14, fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkPrimary },
  inputIcon: { marginLeft: 8 },

  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: withOpacity(Colors.brandOrange, 0.12), borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginLeft: 8 },
  savedChipText: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.brandOrange },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  nameText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accentGreen },
  errorText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.brandCoral, marginBottom: 20 },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginBottom: 20 },

  btnRow: { flexDirection: 'row', gap: 10 },
  btnFlex1: { flex: 1 },
  btnFlex14: { flex: 1.4 },
})

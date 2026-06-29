import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Keyboard } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { CheckCircle2, XCircle, X } from 'lucide-react-native'
import RazorpayCustomUI from 'react-native-customui'
import { Colors, FontFamily } from '@/constants'
import { hTap, hSuccess } from '@/lib/haptics'

interface VpaResult { name: string; vpa: string }

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
  const [vpa, setVpa] = useState('')
  const [vpaResult, setVpaResult] = useState<VpaResult | null>(null)
  const [vpaError, setVpaError] = useState(false)
  const [checking, setChecking] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  const validFormat = /^[\w.\-]+@[\w]+$/.test(vpa.trim())
  const canPay = validFormat && vpaResult !== null && !vpaError

  useEffect(() => { ref.current?.present() }, [])

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => ref.current?.snapToIndex(1))
    const hide = Keyboard.addListener('keyboardDidHide', () => ref.current?.snapToIndex(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  useEffect(() => {
    if (rzpKey && !initializedRef.current) {
      RazorpayCustomUI.initRazorpay(rzpKey)
      initializedRef.current = true
    }
  }, [rzpKey])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setVpaResult(null)
    setVpaError(false)
    if (!validFormat) return
    debounceRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const res: any = await RazorpayCustomUI.isValidVpa(vpa.trim())
        if (res?.customer_name || res?.name) {
          setVpaResult({ name: res.customer_name ?? res.name, vpa: vpa.trim() })
        } else {
          setVpaError(true)
        }
      } catch {
        setVpaError(true)
      } finally {
        setChecking(false)
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [vpa, validFormat])

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
            autoFocus
            returnKeyType="done"
          />
          {checking && (
            <ActivityIndicator size="small" color={Colors.inkDisabled} style={s.inputIcon} />
          )}
          {!checking && vpaResult && (
            <CheckCircle2 size={20} color={Colors.accentGreen} strokeWidth={2} style={s.inputIcon} />
          )}
          {!checking && vpaError && (
            <XCircle size={20} color="#FF3864" strokeWidth={2} style={s.inputIcon} />
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

        <Pressable
          style={[s.payBtn, !canPay && s.payBtnDisabled]}
          onPress={() => { if (canPay) { hSuccess(); onPay(vpa.trim()) } }}
          disabled={!canPay}
        >
          <Text style={s.payBtnText}>{canPay ? 'Pay' : 'Verify UPI ID first'}</Text>
        </Pressable>
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
  sheetBg: { backgroundColor: '#141414' },
  sheetHandle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputWrapError: { borderColor: '#FF3864' },
  inputWrapSuccess: { borderColor: Colors.accentGreen },
  input: { flex: 1, paddingVertical: 14, fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkPrimary },
  inputIcon: { marginLeft: 8 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  nameText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accentGreen },
  errorText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: '#FF3864', marginBottom: 20 },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginBottom: 20 },

  payBtn: { height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111', letterSpacing: 0.3 },
})

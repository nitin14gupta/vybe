import { useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Colors, FontFamily } from '@/constants'

interface Props {
  visible: boolean
  title: string
  body: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

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

export function ConfirmSheet({ visible, title, body, confirmLabel, destructive, onConfirm, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (visible) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
  }, [visible])

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
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>
        <Pressable
          style={[s.btn, destructive ? s.btnDestructive : s.btnConfirm]}
          onPress={() => { onConfirm(); onClose() }}
        >
          <Text style={[s.btnText, destructive && s.btnTextDestructive]}>{confirmLabel}</Text>
        </Pressable>
        <Pressable style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
    gap: 12,
  },
  title: {
    fontFamily: FontFamily.headingBold, fontSize: 18,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.inkSecondary, textAlign: 'center', lineHeight: 20,
  },
  btn: {
    height: 52, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnConfirm: { backgroundColor: Colors.brandOrange },
  btnDestructive: { backgroundColor: 'rgba(200,50,50,0.15)', borderWidth: 1, borderColor: 'rgba(200,50,50,0.4)' },
  btnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#111' },
  btnTextDestructive: { color: '#e05555' },
  cancelBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
})

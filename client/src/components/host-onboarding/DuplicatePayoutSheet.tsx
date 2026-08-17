import { memo, useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { ShieldAlert } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { PrimaryButton } from '@/components/ui'

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

function DuplicatePayoutSheetCore({ message, onClose }: { message: string; onClose: () => void }) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

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
        <View style={s.iconWrap}>
          <ShieldAlert size={30} color={Colors.inkPrimary} strokeWidth={1.6} />
        </View>
        <Text style={s.title}>This account is already in use</Text>
        <Text style={s.body}>{message}</Text>
        <Text style={s.hint}>
          Each payout account can only be linked to one Gorave host. Double-check the details or use a different account.
        </Text>
        <PrimaryButton
          label="Edit details"
          onPress={() => { hTap(); onClose() }}
          style={s.btn}
        />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

function DuplicatePayoutSheetBase({ visible, message, onClose }: { visible: boolean; message: string; onClose: () => void }) {
  if (!visible) return null
  return <DuplicatePayoutSheetCore message={message} onClose={onClose} />
}

export const DuplicatePayoutSheet = memo(DuplicatePayoutSheetBase)

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: Colors.divider },
  content: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 4, alignItems: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, textAlign: 'center', marginBottom: 8 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkDisabled, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  btn: { width: '100%' },
})

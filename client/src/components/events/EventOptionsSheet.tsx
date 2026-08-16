import React, { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Pencil, Users, X as XIcon } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

function renderOptionsBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.5} />
}

interface CoreProps {
  onEdit: () => void
  onCancel: () => void
  onWaitlist: () => void
  onClose: () => void
  showWaitlist: boolean
}

function EventOptionsSheetCore({ onEdit, onCancel, onWaitlist, onClose, showWaitlist }: CoreProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  useEffect(() => { sheetRef.current?.present() }, [])
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={[showWaitlist ? '42%' : '28%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderOptionsBackdrop}
      backgroundStyle={styles.optionsBg}
      handleIndicatorStyle={styles.optionsHandle}
    >
      <BottomSheetView style={styles.optionsContent}>
        <Pressable style={styles.optionItem} onPress={() => { onClose(); onEdit() }}>
          <Pencil size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
          <Text style={styles.optionText}>Edit Event</Text>
        </Pressable>
        {showWaitlist && (
          <>
            <View style={styles.optionDivider} />
            <Pressable style={styles.optionItem} onPress={() => { onClose(); onWaitlist() }}>
              <Users size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
              <Text style={styles.optionText}>Manage Waitlist</Text>
            </Pressable>
          </>
        )}
        <View style={styles.optionDivider} />
        <Pressable style={styles.optionItem} onPress={() => { onClose(); onCancel() }}>
          <XIcon size={20} color={Colors.brandCoral} strokeWidth={1.8} />
          <Text style={[styles.optionText, { color: Colors.brandCoral }]}>Cancel Event</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

interface Props extends CoreProps {
  visible: boolean
}

export function EventOptionsSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <EventOptionsSheetCore {...rest} />
}

const styles = StyleSheet.create({
  optionsBg: { backgroundColor: Colors.surface },
  optionsHandle: { backgroundColor: withOpacity(Colors.white, 0.2) },
  optionsContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  optionText: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
  optionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },
})

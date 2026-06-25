import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { hTap, hError } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

export interface DotsAction {
  key: string
  label: string
  destructive?: boolean
}

interface Props {
  visible: boolean
  title?: string | null
  actions: DotsAction[]
  onAction: (key: string) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function DotsSheetCore({ title, actions, onAction, onClose }: Omit<Props, 'visible'>) {
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
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        {title ? <Text style={s.title}>{title}</Text> : null}
        {actions.map((action, i) => (
          <View key={action.key}>
            {i > 0 && <View style={s.divider} />}
            <Pressable
              style={s.row}
              android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
              onPress={() => { action.destructive ? hError() : hTap(); sheetRef.current?.dismiss(); onAction(action.key) }}
            >
              <Text style={[s.rowText, action.destructive && s.rowTextDestructive]}>{action.label}</Text>
            </Pressable>
          </View>
        ))}
        <View style={{ height: 16 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function DotsSheet(props: Props) {
  if (!props.visible) return null
  return <DotsSheetCore {...props} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingTop: 8, paddingBottom: 0 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 17,
  },
  rowText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  rowTextDestructive: {
    color: Colors.brandCoral,
    fontFamily: FontFamily.bodySemiBold,
  },
})

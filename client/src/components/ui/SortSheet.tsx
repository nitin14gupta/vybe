import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.7

export interface SortOption<T extends string = string> {
  key: T
  label: string
}

interface Props<T extends string> {
  visible: boolean
  title?: string
  options: SortOption<T>[]
  selected: T
  onSelect: (key: T) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function SortSheetCore<T extends string>({ title, options, selected, onSelect, onClose }: Omit<Props<T>, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      {title && <Text style={s.title}>{title}</Text>}
      <BottomSheetScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {options.map(opt => (
          <Pressable
            key={opt.key}
            style={[s.row, selected === opt.key && s.rowActive]}
            android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}
            onPress={() => { hSelection(); onSelect(opt.key); sheetRef.current?.dismiss() }}
          >
            <Text style={[s.rowText, selected === opt.key && s.rowTextActive]} numberOfLines={1}>{opt.label}</Text>
            {selected === opt.key && <View style={s.dot} />}
          </Pressable>
        ))}
        <View style={{ height: 16 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

export function SortSheet<T extends string>(props: Props<T>) {
  if (!props.visible) return null
  return <SortSheetCore {...props} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingTop: 8, paddingBottom: 0 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.inkSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowActive: { backgroundColor: withOpacity(Colors.brandOrange, 0.06) },
  rowText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  rowTextActive: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.brandOrange,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.brandOrange,
  },
})

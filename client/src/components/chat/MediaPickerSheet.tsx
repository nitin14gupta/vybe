import { forwardRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Camera, Images } from 'lucide-react-native'
import { Colors, FontFamily, Radius } from '@/constants'

interface Props {
  onCamera: () => void
  onLibrary: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

export const MediaPickerSheet = forwardRef<BottomSheetModal, Props>(
  ({ onCamera, onLibrary }, ref) => {
    const dismiss = () => (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()

    const pick = (handler: () => void) => {
      dismiss()
      // slight delay so sheet closes before system picker opens
      setTimeout(handler, 220)
    }

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={s.bg}
        handleIndicatorStyle={s.handle}
      >
        <BottomSheetView style={s.content}>
          <Text style={s.heading}>Add to message</Text>

          <View style={s.grid}>
            <Pressable style={s.tile} onPress={() => pick(onCamera)} android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}>
              <View style={s.iconWrap}>
                <Camera size={26} color={Colors.brandOrange} strokeWidth={1.6} />
              </View>
              <Text style={s.tileLabel}>Camera</Text>
              <Text style={s.tileSub}>Photo or video</Text>
            </Pressable>

            <Pressable style={s.tile} onPress={() => pick(onLibrary)} android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}>
              <View style={s.iconWrap}>
                <Images size={26} color={Colors.brandOrange} strokeWidth={1.6} />
              </View>
              <Text style={s.tileLabel}>Photos</Text>
              <Text style={s.tileSub}>Select up to 12 from your library</Text>
            </Pressable>
          </View>

          <View style={s.spacer} />
        </BottomSheetView>
      </BottomSheetModal>
    )
  }
)

MediaPickerSheet.displayName = 'MediaPickerSheet'

const s = StyleSheet.create({
  bg: { backgroundColor: '#161616' },
  handle: { backgroundColor: 'rgba(255,255,255,0.15)', width: 36 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: Colors.inkPrimary,
    marginBottom: 20,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  tileSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  spacer: { height: 24 },
})

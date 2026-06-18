import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { LinearGradient } from 'expo-linear-gradient'
import { MessageSquareOff, BellOff } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

interface Props {
  visible: boolean
  targetName: string | null
  isBlocked: boolean
  loading?: boolean
  onBlock: () => void
  onUnblock: () => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.55}
    />
  )
}

export function BlockSheet({ visible, targetName, isBlocked, loading, onBlock, onUnblock, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const name = targetName ?? 'this user'

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
        {!isBlocked && (
          <>
            <Text style={s.title}>Block {name}?</Text>
            <View style={s.bulletRow}>
              <MessageSquareOff size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
              <Text style={s.bulletText}>They won't be able to message you or see your profile.</Text>
            </View>
            <View style={s.bulletRow}>
              <BellOff size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
              <Text style={s.bulletText}>They won't be notified that you blocked them.</Text>
            </View>
          </>
        )}

        {isBlocked && (
          <Text style={s.title}>Unblock {name}?</Text>
        )}

        <Pressable
          style={s.mainBtn}
          onPress={isBlocked ? onUnblock : onBlock}
          disabled={loading}
        >
          <LinearGradient
            colors={isBlocked ? ['#444', '#333'] : ['#FF6B35', '#FF3864']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.mainBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.mainBtnText}>{isBlocked ? 'Unblock' : 'Block'}</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 8,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.inkPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  bulletText: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 20,
  },
  mainBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
  },
  mainBtnGrad: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  mainBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  cancelBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
})

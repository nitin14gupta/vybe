import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay } from 'react-native-reanimated'
import { XCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'

const SNAP_POINTS = ['52%']

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="none"
      opacity={0.75}
    />
  )
}

interface Props {
  visible: boolean
  message?: string
  onRetry: () => void
  onBack: () => void
}

function PaymentFailedCore({ message, onRetry, onBack }: Omit<Props, 'visible'>) {
  const ref    = useRef<BottomSheetModal>(null)
  const scale  = useSharedValue(0)
  const shake  = useSharedValue(0)

  const isCancelled = message === 'Payment was cancelled.'

  useEffect(() => {
    ref.current?.present()
    scale.value = withSpring(1, { damping: 10, stiffness: 180 })
    if (!isCancelled) {
      shake.value = withDelay(
        300,
        withSequence(
          withTiming(-8, { duration: 60 }),
          withTiming(8,  { duration: 60 }),
          withTiming(-6, { duration: 50 }),
          withTiming(6,  { duration: 50 }),
          withTiming(0,  { duration: 40 }),
        ),
      )
    }
  }, [])

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
  }))

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <Animated.View>
          {isCancelled
            ? <AlertCircle size={52} color="#FFB830" strokeWidth={1.5} />
            : <XCircle size={52} color="#FF3864" strokeWidth={1.5} />
          }
        </Animated.View>

        <Text style={s.title}>{isCancelled ? 'Payment Cancelled' : 'Payment Failed'}</Text>
        <Text style={s.message}>
          {isCancelled
            ? 'You came back without completing the payment. Want to try again?'
            : (message ?? 'Something went wrong. Your money is safe — no amount was deducted.')
          }
        </Text>

        <View style={s.actions}>
          <Pressable style={s.retryBtn} onPress={() => { hTap(); onRetry() }}>
            <RefreshCw size={16} color="#111" strokeWidth={2} />
            <Text style={s.retryText}>Try Again</Text>
          </Pressable>

          <Pressable style={s.backBtn} onPress={() => { hTap(); onBack() }}>
            <ArrowLeft size={16} color={Colors.inkSecondary} strokeWidth={1.8} />
            <Text style={s.backText}>Go Back</Text>
          </Pressable>
        </View>

        {!isCancelled && (
          <Text style={s.note}>
            If any amount was deducted it will be refunded to your source within 5–7 business days.
          </Text>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function PaymentFailedSheet({ visible, message, onRetry, onBack }: Props) {
  if (!visible) return null
  return <PaymentFailedCore message={message} onRetry={onRetry} onBack={onBack} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#141414' },
  handle: { backgroundColor: 'rgba(255,255,255,0.1)' },
  content: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 8, alignItems: 'center' },

  iconWrap: { marginTop: 8, marginBottom: 20 },

  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },

  actions: { width: '100%', gap: 10 },

  retryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },

  backBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },

  note: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
})

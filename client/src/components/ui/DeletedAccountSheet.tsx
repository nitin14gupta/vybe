import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { AlertTriangle } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'

const SUPPORT_EMAIL = 'support@vybe.in'

interface Props {
  visible: boolean
  deletedOn: string   // e.g. "13 Jun 2025"
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

function DeletedAccountSheetCore({ deletedOn, onClose }: Omit<Props, 'visible'>) {
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => { ref.current?.present() }, [])

  const handleContact = () => {
    hTap()
    const subject = encodeURIComponent('[Vybe] Account Recovery Request')
    const body    = encodeURIComponent(
      `Hi,\n\nI requested account deletion on ${deletedOn} and would like to recover my account.\n\nRegistered phone: `,
    )
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`)
  }

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={false}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <View style={s.iconWrap}>
          <AlertTriangle size={32} color={Colors.brandCoral} strokeWidth={1.8} />
        </View>

        <Text style={s.title}>Account Deletion Requested</Text>

        <Text style={s.body}>
          You requested deletion of this account on{' '}
          <Text style={s.date}>{deletedOn}</Text>
          . Your account is scheduled for permanent removal within 30 days.
        </Text>

        <Text style={s.sub}>
          Changed your mind? Contact us within 30 days and we'll restore everything.
        </Text>

        <Pressable style={s.contactBtn} onPress={handleContact}>
          <Text style={s.contactText}>Contact Support to Recover</Text>
        </Pressable>

        <Pressable style={s.dismissBtn} onPress={() => { hTap(); onClose() }}>
          <Text style={s.dismissText}>OK, understood</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function DeletedAccountSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <DeletedAccountSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8, gap: 12, alignItems: 'center' },

  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,56,100,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },

  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  date: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.inkPrimary,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: 'center',
    lineHeight: 19,
  },

  contactBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  contactText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111',
  },
  dismissBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
})

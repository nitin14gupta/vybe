import { useRef, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Lock } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { useLockStore } from '@/store/lockStore'
import { useAuth } from '@/hooks/useAuth'
import { hTap } from '@/lib/haptics'

function renderBackdrop(props: BottomSheetBackdropProps) {
  // pressBehavior="none" — unlike DeletedAccountSheet, this backdrop cannot
  // be tapped away. Logging out is the only way out.
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="none"
      opacity={0.7}
    />
  )
}

function AccountLockedOverlayCore({ reason }: { reason: string }) {
  const ref = useRef<BottomSheetModal>(null)
  const { handleLogout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => { ref.current?.present() }, [])

  const onLogOut = async () => {
    if (loggingOut) return
    hTap()
    setLoggingOut(true)
    try {
      await handleLogout()
    } finally {
      useLockStore.getState().reset()
    }
  }

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleComponent={null}
    >
      <BottomSheetView style={s.content}>
        <View style={s.iconWrap}>
          <Lock size={32} color={Colors.brandCoral} strokeWidth={1.8} />
        </View>

        <Text style={s.title}>Your account has been locked by the Gorave team.</Text>

        {reason ? <Text style={s.body}>{reason}</Text> : null}

        <Text style={s.sub}>
          If you think this is a mistake, contact support after logging out.
        </Text>

        <Pressable style={s.logoutBtn} onPress={onLogOut} disabled={loggingOut}>
          <Text style={s.logoutText}>{loggingOut ? 'Logging out…' : 'Log Out'}</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function AccountLockedOverlay() {
  const locked = useLockStore((s) => s.locked)
  const reason = useLockStore((s) => s.reason)
  if (!locked) return null
  return <AccountLockedOverlayCore reason={reason} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 32, gap: 12, alignItems: 'center' },

  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,56,100,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },

  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 19,
    color: Colors.inkPrimary,
    textAlign: 'center',
    lineHeight: 25,
  },
  body: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: 'center',
    lineHeight: 19,
  },

  logoutBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111',
  },
})

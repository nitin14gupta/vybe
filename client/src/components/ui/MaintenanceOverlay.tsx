import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Wrench } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { useMaintenanceStore } from '@/store/maintenanceStore'
import { API_BASE_URL } from '@/api/config'
import { hTap } from '@/lib/haptics'

function MaintenanceOverlayCore({ message }: { message: string }) {
  const insets = useSafeAreaInsets()
  const [checking, setChecking] = useState(false)

  const onRetry = async () => {
    if (checking) return
    hTap()
    setChecking(true)
    try {
      const res = await fetch(`${API_BASE_URL}/health`)
      if (res.ok) useMaintenanceStore.getState().deactivate()
    } catch {
      // still down — stay on screen
    } finally {
      setChecking(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={s.iconWrap}>
        <Wrench size={32} color={Colors.brandOrange} strokeWidth={1.8} />
      </View>

      <Text style={s.title}>We&apos;ll be right back</Text>
      <Text style={s.body}>
        {message || "Gorave is undergoing scheduled maintenance. We'll be back shortly."}
      </Text>

      <Pressable style={s.retryBtn} onPress={onRetry} disabled={checking}>
        <Text style={s.retryText}>{checking ? 'Checking…' : 'Try Again'}</Text>
      </Pressable>
    </View>
  )
}

export function MaintenanceOverlay() {
  const active = useMaintenanceStore((s) => s.active)
  const message = useMaintenanceStore((s) => s.message)
  if (!active) return null
  return <MaintenanceOverlayCore message={message} />
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10000,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },

  iconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },

  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  retryBtn: {
    marginTop: 16,
    minWidth: 160,
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111',
  },
})

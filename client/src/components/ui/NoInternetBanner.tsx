import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NetInfo from '@react-native-community/netinfo'
import { WifiOff, RefreshCw } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { useNetworkStore } from '@/store/networkStore'
import { hTap } from '@/lib/haptics'

export function NoInternetBanner() {
  const online = useNetworkStore((s) => s.online)
  const insets = useSafeAreaInsets()
  const [checking, setChecking] = useState(false)
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(online ? 0 : 1, { duration: 250, easing: Easing.out(Easing.quad) })
  }, [online])

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 40 }],
  }))

  if (online && progress.value === 0) return null

  const onRetry = async () => {
    if (checking) return
    hTap()
    setChecking(true)
    const state = await NetInfo.fetch()
    const isOnline = state.isConnected !== false && state.isInternetReachable !== false
    useNetworkStore.getState().setOnline(isOnline)
    setChecking(false)
  }

  return (
    <Animated.View
      pointerEvents={online ? 'none' : 'auto'}
      style={[s.wrap, { bottom: insets.bottom + 12 }, style]}
    >
      <View style={s.iconWrap}>
        <WifiOff size={16} color={Colors.inkPrimary} strokeWidth={2} />
      </View>
      <Text style={s.text} numberOfLines={2}>
        You&apos;re offline
      </Text>
      <Pressable style={s.retryBtn} onPress={onRetry} disabled={checking} hitSlop={8}>
        <RefreshCw size={14} color={Colors.brandOrange} strokeWidth={2.2} />
        <Text style={s.retryText}>{checking ? 'Checking…' : 'Retry'}</Text>
      </Pressable>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(245,240,235,0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(245,240,235,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkPrimary,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.brandOrange,
  },
})

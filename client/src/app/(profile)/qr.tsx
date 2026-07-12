import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Share2, Download } from 'lucide-react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { FontFamily } from '@/constants'
import { buildProfileShareUrl } from '@/lib/deepLink'
import { useQrShare } from '@/hooks/useQrShare'
import { QrCard } from '@/components/ui'

// ── Animated icon action (Share / Save) ──────────────────────────────────────

function IconAction({ Icon, label, onPress }: { Icon: typeof Share2; label: string; onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={() => { hTap(); scale.value = withSpring(0.94, { damping: 18, stiffness: 380 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }) }}
      onPress={onPress}
    >
      <Animated.View style={[s.actionBtn, animStyle]}>
        <Icon size={20} color="#111" strokeWidth={2.2} />
        <Text style={s.actionBtnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileQrScreen() {
  const { userId, username, name } = useLocalSearchParams<{ userId: string; username?: string; name?: string }>()
  const insets = useSafeAreaInsets()

  const shareUrl = buildProfileShareUrl(userId, username)
  const handle = username ? `@${username}` : (name ?? 'this profile')
  const { cardRef, handleShare, handleSave } = useQrShare(`Hey, this is my profile on Vybe! Follow me 🔥\n${shareUrl}`)

  return (
    <View style={s.root}>
      <Pressable
        style={[s.closeBtn, { top: insets.top + 8 }]}
        onPress={() => { hTap(); router.back() }}
        hitSlop={10}
      >
        <X size={22} color="#fff" strokeWidth={2.2} />
      </Pressable>

      <View style={s.center}>
        <QrCard ref={cardRef} data={shareUrl} title={handle} subtitle={name} />
      </View>

      <View style={[s.actionsRow, { paddingBottom: insets.bottom + 24 }]}>
        <IconAction Icon={Share2} label="Share" onPress={handleShare} />
        <IconAction Icon={Download} label="Save" onPress={handleSave} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 26,
  },
  actionBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111',
  },
})

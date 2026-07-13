import { View, Pressable, StyleSheet } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Share2, Download } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { buildProfileShareUrl } from '@/lib/deepLink'
import { Colors } from '@/constants'
import { useQrShare } from '@/hooks/useQrShare'
import { QrCard, PrimaryButton, OutlineButton } from '@/components/ui'

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
        <View style={s.actionBtn}>
          <PrimaryButton label="Share" onPress={handleShare} icon={<Share2 size={18} color={Colors.background} strokeWidth={2.2} />} />
        </View>
        <View style={s.actionBtn}>
          <OutlineButton label="Save" onPress={handleSave} icon={<Download size={18} color={Colors.inkPrimary} strokeWidth={2.2} />} />
        </View>
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
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  actionBtn: { flex: 1 },
})

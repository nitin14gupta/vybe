import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft, MoreVertical, Ghost, X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

interface Props {
  partnerName: string | null
  partnerUsername: string | null
  partnerAvatar: string | null
  partnerId: string | null
  partnerIsDeleted?: boolean
  isPartnerOnline: boolean
  isWsConnected: boolean
  loading: boolean
  onMenuPress: () => void
  /** Bulk-select mode — swaps the back chevron for an X (exits select mode
   * instead of navigating back) and shows "N selected" instead of the
   * partner's name/status. */
  selectMode?: boolean
  selectedCount?: number
  onExitSelect?: () => void
}

export function ChatHeader({
  partnerName, partnerUsername, partnerAvatar, partnerId, partnerIsDeleted,
  isPartnerOnline, isWsConnected, loading, onMenuPress,
  selectMode, selectedCount = 0, onExitSelect,
}: Props) {
  const insets = useSafeAreaInsets()

  if (selectMode) {
    return (
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onExitSelect} style={s.backBtn} hitSlop={8}>
          <X size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.center}>
          <Text style={s.name}>{selectedCount} selected</Text>
        </View>
      </View>
    )
  }

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={s.center}
          onPress={() => partnerId && router.push(`/(profile)/${partnerId}` as any)}
        >
          {partnerIsDeleted
            ? (
              <View style={[s.avatar, s.avatarDeleted]}>
                <Ghost size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
              </View>
            )
            : partnerAvatar
            ? <Image source={{ uri: partnerAvatar }} style={s.avatar} />
            : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
              </View>
            )
          }
          <View>
            <View style={s.nameRow}>
              <Text style={[s.name, partnerIsDeleted && s.nameDeleted]}>{partnerName ?? 'Chat'}</Text>
              {isPartnerOnline && !partnerIsDeleted && <View style={s.onlineDot} />}
            </View>
            <Text style={s.sub}>
              {partnerIsDeleted
                ? 'This account no longer exists'
                : partnerUsername
                ? `@${partnerUsername}`
                : (isPartnerOnline ? 'Active now' : 'Tap for profile')
              }
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={onMenuPress} hitSlop={8}>
          <MoreVertical size={22} color={Colors.inkSecondary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {!isWsConnected && !loading && (
        <View style={s.reconnectBanner}>
          <Text style={s.reconnectText}>Reconnecting…</Text>
        </View>
      )}
    </>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  avatarDeleted: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  nameDeleted: { color: Colors.inkDisabled },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  reconnectBanner: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,107,53,0.3)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  reconnectText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.brandOrange },
})

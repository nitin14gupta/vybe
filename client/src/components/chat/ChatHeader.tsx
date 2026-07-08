import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft, MoreVertical } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

interface Props {
  partnerName: string | null
  partnerUsername: string | null
  partnerAvatar: string | null
  partnerId: string | null
  isPartnerOnline: boolean
  isWsConnected: boolean
  loading: boolean
  onMenuPress: () => void
}

export function ChatHeader({
  partnerName, partnerUsername, partnerAvatar, partnerId,
  isPartnerOnline, isWsConnected, loading, onMenuPress,
}: Props) {
  const insets = useSafeAreaInsets()

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={s.center}
          onPress={() => partnerId && router.push(`/(profile)/${partnerId}` as any)}
        >
          {partnerAvatar
            ? <Image source={{ uri: partnerAvatar }} style={s.avatar} />
            : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
              </View>
            )
          }
          <View>
            <View style={s.nameRow}>
              <Text style={s.name}>{partnerName ?? 'Chat'}</Text>
              {isPartnerOnline && <View style={s.onlineDot} />}
            </View>
            <Text style={s.sub}>
              {partnerUsername
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: Colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.brandOrange },
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

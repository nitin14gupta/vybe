import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { ChevronLeft, Clock, Flame } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'

export default function PendingChatScreen() {
  const insets = useSafeAreaInsets()
  const { partnerName, partnerAvatar, message } = useLocalSearchParams<{
    partnerName?: string
    partnerAvatar?: string
    message?: string
  }>()

  const name = partnerName ?? 'them'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => { hTap(); router.back() }} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerName} numberOfLines={1}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar area */}
      <View style={s.avatarSection}>
        <View style={s.avatarRing}>
          {partnerAvatar ? (
            <Image source={{ uri: partnerAvatar }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.flameBadge}>
            <Flame size={16} color="#111" fill="#111" />
          </View>
        </View>
      </View>

      {/* Status card */}
      <View style={s.card}>
        <View style={s.iconRow}>
          <Clock size={32} color={Colors.brandOrange} strokeWidth={1.5} />
        </View>
        <Text style={s.heading}>Vybe sent to {name}</Text>
        <Text style={s.sub}>
          Your vybe is waiting for {name} to accept. Once they accept, you'll both
          be asked to write an icebreaker to start the conversation.
        </Text>

        {message ? (
          <View style={s.msgBox}>
            <Text style={s.msgLabel}>YOUR MESSAGE</Text>
            <Text style={s.msgText}>"{message}"</Text>
          </View>
        ) : null}
      </View>

      {/* Tip */}
      <Text style={s.tip}>
        You'll get a notification when {name} responds
      </Text>

      {/* Go back to explore */}
      <Pressable style={s.discoverBtn} onPress={() => { hTap(); router.navigate('/(tabs)/') }}>
        <Text style={s.discoverBtnText}>Explore more people</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  headerName: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.brandOrange,
    padding: 3,
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 44 },
  avatarFallback: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary },
  flameBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  msgBox: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    marginTop: 4,
  },
  msgLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.inkDisabled,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  msgText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tip: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
  discoverBtn: {
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    alignItems: 'center',
  },
  discoverBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandOrange,
  },
})

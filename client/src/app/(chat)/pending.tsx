import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Clock, Flame } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import { PrimaryButton, LogoMark } from '@/components/ui'

export default function PendingChatScreen() {
  const insets = useSafeAreaInsets()
  const { partnerId, partnerName, partnerAvatar, message } = useLocalSearchParams<{
    partnerId?: string
    partnerName?: string
    partnerAvatar?: string
    message?: string
  }>()

  const name = partnerName ?? 'them'
  const goToProfile = () => {
    if (!partnerId) return
    hTap()
    router.push(`/(profile)/${partnerId}` as any)
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerName} numberOfLines={1}>{name}</Text>
        <View style={s.headerLogo}>
          <LogoMark size={22} opacity={0.5} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar area */}
        <View style={s.avatarSection}>
          <Pressable onPress={goToProfile} style={s.avatarRing} hitSlop={6}>
            {partnerAvatar ? (
              <Image
                source={{ uri: partnerAvatar }}
                style={s.avatar}
                cachePolicy="memory-disk"
                priority="high"
                transition={150}
              />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={s.flameBadge}>
              <Flame size={16} color={Colors.background} fill={Colors.background} />
            </View>
          </Pressable>
        </View>

        {/* Status card */}
        <View style={s.card}>
          <View style={s.iconRow}>
            <Clock size={32} color={Colors.inkPrimary} strokeWidth={1.5} />
          </View>
          <Text style={s.heading}>Vibe sent to {name}</Text>
          <Text style={s.sub}>
            Your vibe is waiting for {name} to accept. Once they accept, you'll both
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
        <PrimaryButton
          label="Explore more people"
          onPress={() => router.navigate('/(tabs)/')}
          style={s.discoverBtn}
        />
      </ScrollView>
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
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerName: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  headerLogo: { width: 36, alignItems: 'flex-end' },
  scrollContent: { flexGrow: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.inkPrimary,
    padding: 3,
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 44 },
  avatarFallback: {
    backgroundColor: Colors.surfaceMuted,
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
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.glassSurface,
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
    backgroundColor: Colors.skeletonBase,
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
  },
})

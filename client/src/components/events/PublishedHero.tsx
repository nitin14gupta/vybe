import React, { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { Link2, MessageCircle, Rocket, Share2 } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

function RocketIcon() {
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[s.rocketWrap, { transform: [{ translateY: floatAnim }] }]}>
      <Rocket size={64} color={Colors.inkPrimary} strokeWidth={1.5} />
    </Animated.View>
  )
}

function ShareBtn({
  icon, label, onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable style={s.shareBtn} onPress={onPress}>
      <View style={s.shareBtnIcon}>{icon}</View>
      <Text style={s.shareBtnLabel}>{label}</Text>
    </Pressable>
  )
}

export function PublishedHero({
  onShare,
  onShareInChat,
  onCopyLink,
}: {
  onShare: () => void
  onShareInChat: () => void
  onCopyLink: () => void
}) {
  return (
    <>
      <RocketIcon />

      <View style={s.headlineRow}>
        <Text style={s.headline}>Your event is live!</Text>
      </View>
      <Text style={s.sub}>Share to get your first guests and start building the vibe.</Text>

      <BlurView intensity={20} tint="dark" style={s.shareCard}>
        <Text style={s.shareCardLabel}>SHARE WITH FRIENDS</Text>
        <View style={s.shareRow}>
          <ShareBtn
            icon={<View style={[s.shareBtnIconInner, { backgroundColor: withOpacity(Colors.inkPrimary, 0.1) }]}><Share2 size={22} color={Colors.inkPrimary} strokeWidth={1.8} /></View>}
            label="Share"
            onPress={onShare}
          />
          <ShareBtn
            icon={<View style={[s.shareBtnIconInner, { backgroundColor: withOpacity(Colors.inkPrimary, 0.1) }]}><MessageCircle size={22} color={Colors.inkPrimary} strokeWidth={1.8} /></View>}
            label="Share in Chat"
            onPress={onShareInChat}
          />
          <ShareBtn
            icon={<View style={[s.shareBtnIconInner, { backgroundColor: withOpacity(Colors.inkPrimary, 0.1) }]}><Link2 size={22} color={Colors.inkPrimary} strokeWidth={1.8} /></View>}
            label="Copy Link"
            onPress={onCopyLink}
          />
        </View>
      </BlurView>
    </>
  )
}

const s = StyleSheet.create({
  rocketWrap: { marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: 'rgba(229,226,225,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  shareCard: {
    width: '100%',
    backgroundColor: 'rgba(20,20,20,0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: withOpacity(Colors.inkPrimary, 0.12),
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  shareCardLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: withOpacity(Colors.inkPrimary, 0.4),
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  shareRow: { flexDirection: 'row', justifyContent: 'space-around' },
  shareBtn: { alignItems: 'center', gap: 8 },
  shareBtnIcon: {},
  shareBtnIconInner: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: 'rgba(229,226,225,0.65)',
  },
})

import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

interface Props {
  partnerId: string | null
  partnerName: string | null
  partnerUsername: string | null
  partnerAvatar: string | null
}

// Shown once, above the very first message in a conversation — a quick
// "who is this" recap, matching the pattern of avatar + name + View Profile
// seen at the top of DM threads in other apps.
export function ChatPartnerPreview({ partnerId, partnerName, partnerUsername, partnerAvatar }: Props) {
  const goToProfile = () => {
    hTap()
    if (partnerId) router.push(`/(profile)/${partnerId}` as any)
  }

  return (
    <View style={s.root}>
      <Pressable onPress={goToProfile} hitSlop={8}>
        {partnerAvatar ? (
          <Image source={{ uri: partnerAvatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
          </View>
        )}
      </Pressable>
      <Text style={s.name}>{partnerName ?? 'User'}</Text>
      {partnerUsername ? <Text style={s.username}>@{partnerUsername}</Text> : null}
      <Pressable onPress={goToProfile} style={s.viewProfileBtn} hitSlop={6}>
        <Text style={s.viewProfileText}>View profile</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingTop: 24, paddingBottom: 28, gap: 4 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: Colors.divider },
  avatarFallback: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary },
  name: {
    fontFamily: FontFamily.headingBold, fontSize: 19, color: Colors.inkPrimary,
    marginTop: 12,
  },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled },
  viewProfileBtn: {
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  viewProfileText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})

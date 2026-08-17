import React, { memo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { MoreVertical } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton, OutlineButton } from '@/components/ui'
import type { FollowUser } from '@/api/apiService'

interface Props {
  user: FollowUser
  type: 'followers' | 'following'
  isMyProfile: boolean
  onFollow: (id: string) => void
  onUnfollow: (id: string) => void
  onRemove: (id: string) => void
  onDots: (user: FollowUser) => void
}

export const UserFollowCard = memo(function UserFollowCard({ user, type, isMyProfile, onFollow, onUnfollow, onRemove, onDots }: Props) {
  const [actionLoading, setActionLoading] = useState(false)

  const initial = (user.name ?? user.username ?? '?').charAt(0).toUpperCase()

  const handleAction = async (fn: () => void) => {
    setActionLoading(true)
    fn()
    setTimeout(() => setActionLoading(false), 600)
  }

  const renderButton = () => {
    if (user.is_me) return null

    if (isMyProfile && type === 'followers') {
      return <OutlineButton label="Remove" size="small" style={s.btnWidth} onPress={() => onRemove(user.id)} />
    }

    if (isMyProfile && type === 'following') {
      return <OutlineButton label="Unfollow" size="small" style={s.btnWidth} onPress={() => onUnfollow(user.id)} />
    }

    return user.is_following ? (
      <OutlineButton
        label="Following"
        size="small"
        style={s.btnWidth}
        loading={actionLoading}
        onPress={() => handleAction(() => onUnfollow(user.id))}
      />
    ) : (
      <PrimaryButton
        label="Follow"
        size="small"
        style={s.btnWidth}
        loading={actionLoading}
        onPress={() => handleAction(() => onFollow(user.id))}
      />
    )
  }

  return (
    <Pressable
      style={s.row}
      onPress={() => router.push(`/(profile)/${user.id}` as any)}
      android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.04) }}
    >
      {/* Avatar */}
      <View style={s.avatar}>
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        ) : (
          <Text style={s.avatarInitial}>{initial}</Text>
        )}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.username} numberOfLines={1}>
          {user.username ?? user.name ?? 'user'}
          {user.is_me ? <Text style={s.youBadge}> · You</Text> : null}
        </Text>
        {user.name ? (
          <Text style={s.name} numberOfLines={1}>{user.name}</Text>
        ) : null}
        {user.follows_back && type === 'following' ? (
          <Text style={s.followsBack}>Follows you back</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {renderButton()}
        {!user.is_me && (
          <Pressable
            style={s.dotsBtn}
            onPress={() => onDots(user)}
            hitSlop={8}
            android_ripple={null}
          >
            <MoreVertical size={17} color={Colors.inkSecondary} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>
    </Pressable>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkSecondary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  youBadge: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  name: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  followsBack: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.brandOrange,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  btnWidth: { minWidth: 92 },
  dotsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

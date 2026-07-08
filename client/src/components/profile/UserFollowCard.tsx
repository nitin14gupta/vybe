import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { MoreVertical } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, FontFamily } from '@/constants'
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

export function UserFollowCard({ user, type, isMyProfile, onFollow, onUnfollow, onRemove, onDots }: Props) {
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
      return (
        <Pressable
          style={[s.btn, s.btnOutline]}
          android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
          onPress={() => onRemove(user.id)}
        >
          <Text style={s.btnOutlineText}>Remove</Text>
        </Pressable>
      )
    }

    if (isMyProfile && type === 'following') {
      return (
        <Pressable
          style={[s.btn, s.btnOutline]}
          android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
          onPress={() => onUnfollow(user.id)}
        >
          <Text style={s.btnOutlineText}>Unfollow</Text>
        </Pressable>
      )
    }

    return (
      <Pressable
        style={[s.btn, user.is_following ? s.btnOutline : s.btnFill]}
        android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
        onPress={() => handleAction(() => user.is_following ? onUnfollow(user.id) : onFollow(user.id))}
        disabled={actionLoading}
      >
        {actionLoading
          ? <ActivityIndicator size="small" color={user.is_following ? Colors.inkPrimary : '#fff'} />
          : <Text style={user.is_following ? s.btnOutlineText : s.btnFillText}>
              {user.is_following ? 'Following' : 'Follow'}
            </Text>
        }
      </Pressable>
    )
  }

  return (
    <Pressable
      style={s.row}
      onPress={() => router.push(`/(profile)/${user.id}` as any)}
      android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
    >
      {/* Avatar */}
      <View style={s.avatar}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
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
}

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
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  btnFill: {
    backgroundColor: Colors.brandOrange,
  },
  btnFillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: '#111',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  btnOutlineText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  dotsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

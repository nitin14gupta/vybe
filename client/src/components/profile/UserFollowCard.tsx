import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { MoreVertical, MapPin } from 'lucide-react-native'
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
    // optimistic — loading clears on re-render from parent state update
    setTimeout(() => setActionLoading(false), 600)
  }

  const renderButton = () => {
    if (user.is_me) return null

    // My profile → followers list: Remove button
    if (isMyProfile && type === 'followers') {
      return (
        <Pressable
          style={[s.btn, s.btnRemove]}
          onPress={() => handleAction(() => onRemove(user.id))}
          disabled={actionLoading}
        >
          {actionLoading
            ? <ActivityIndicator size="small" color={Colors.inkSecondary} />
            : <Text style={s.btnRemoveText}>Remove</Text>
          }
        </Pressable>
      )
    }

    // My profile → following list: Unfollow button
    if (isMyProfile && type === 'following') {
      return (
        <Pressable
          style={[s.btn, s.btnSecondary]}
          onPress={() => handleAction(() => onUnfollow(user.id))}
          disabled={actionLoading}
        >
          {actionLoading
            ? <ActivityIndicator size="small" color={Colors.inkPrimary} />
            : <Text style={s.btnSecondaryText}>Unfollow</Text>
          }
        </Pressable>
      )
    }

    // Other user's profile: Follow / Following toggle
    return (
      <Pressable
        style={[s.btn, user.is_following ? s.btnSecondary : s.btnPrimary]}
        onPress={() => handleAction(() => user.is_following ? onUnfollow(user.id) : onFollow(user.id))}
        disabled={actionLoading}
      >
        {actionLoading
          ? <ActivityIndicator size="small" color={user.is_following ? Colors.inkPrimary : '#fff'} />
          : <Text style={user.is_following ? s.btnSecondaryText : s.btnPrimaryText}>
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
      android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
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
        <Text style={s.name} numberOfLines={1}>
          {user.name ?? user.username ?? 'Unnamed'}
          {user.is_me ? <Text style={s.youBadge}> · You</Text> : null}
        </Text>
        {user.username ? (
          <Text style={s.username} numberOfLines={1}>@{user.username}</Text>
        ) : null}
        {user.follows_back && type === 'following' ? (
          <Text style={s.followsBack}>Follows you back</Text>
        ) : null}
        {user.city ? (
          <View style={s.cityRow}>
            <MapPin size={11} color={Colors.inkSecondary} strokeWidth={1.5} />
            <Text style={s.city} numberOfLines={1}>{user.city}</Text>
          </View>
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
          >
            <MoreVertical size={18} color={Colors.inkSecondary} strokeWidth={1.5} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkSecondary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  youBadge: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  username: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  followsBack: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.brandOrange,
    marginTop: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  city: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  btnPrimary: {
    backgroundColor: Colors.brandOrange,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  btnSecondaryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
  btnRemove: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,56,100,0.4)',
  },
  btnRemoveText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.brandCoral,
  },
  dotsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

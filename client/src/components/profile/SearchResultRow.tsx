import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'

export const SearchResultRow = memo(function SearchResultRow({ user, onTap }: { user: DiscoverUser; onTap: () => void }) {
  const avatar = user.photos[0]?.url
  return (
    <Pressable style={s.row} onPress={onTap}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} cachePolicy="memory-disk" priority="low" transition={150} />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={s.avatarInitial}>{(user.name ?? '?').charAt(0)}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{user.name ?? 'User'}</Text>
        {user.username ? (
          <Text style={s.username} numberOfLines={1}>@{user.username}</Text>
        ) : null}
      </View>
    </Pressable>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled },
})

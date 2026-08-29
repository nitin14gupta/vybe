import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const SearchResultRow = memo(function SearchResultRow({ user, onTap }: { user: DiscoverUser; onTap: () => void }) {
  const avatar = user.photos[0]?.url
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      style={[s.row, pressStyle]}
      onPress={onTap}
      onPressIn={() => { pressScale.value = withSpring(0.985, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
    >
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
    </AnimatedPressable>
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

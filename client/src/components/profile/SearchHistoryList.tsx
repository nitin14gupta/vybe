import React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { SearchHistoryUser } from '@/store/searchHistoryStore'

interface Props {
  history: SearchHistoryUser[]
  onTap: (user: SearchHistoryUser) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function SearchHistoryList({ history, onTap, onRemove, onClear }: Props) {
  return (
    <FlatList
      data={history}
      keyExtractor={item => item.id}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={s.historyHeader}>
          <Text style={s.historyTitle}>Recent</Text>
          <Pressable onPress={onClear} hitSlop={8}>
            <Text style={s.clearAll}>Clear all</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={s.row} onPress={() => onTap(item)}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={s.avatar} cachePolicy="memory-disk" priority="low" transition={150} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{(item.name ?? '?').charAt(0)}</Text>
            </View>
          )}
          <View style={s.info}>
            <Text style={s.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
            {item.username ? (
              <Text style={s.username} numberOfLines={1}>@{item.username}</Text>
            ) : null}
          </View>
          <Pressable onPress={() => onRemove(item.id)} hitSlop={10} style={s.removeBtn}>
            <X size={16} color={Colors.inkDisabled} strokeWidth={2} />
          </Pressable>
        </Pressable>
      )}
    />
  )
}

const s = StyleSheet.create({
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  historyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearAll: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled },
  removeBtn: { padding: 4 },
})

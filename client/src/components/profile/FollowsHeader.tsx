import React from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { ArrowLeft, ArrowUpDown, Search, X as XIcon } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

interface Props {
  displayName: string
  onBack: () => void
  sortLabel: string
  onOpenSort: () => void
  query: string
  onChangeQuery: (text: string) => void
}

export function FollowsHeader({ displayName, onBack, sortLabel, onOpenSort, query, onChangeQuery }: Props) {
  return (
    <>
      <View style={s.header}>
        <Pressable onPress={onBack} style={s.backBtn} hitSlop={8} android_ripple={null}>
          <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerName} numberOfLines={1}>{displayName || 'Profile'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.toolbarWrap}>
        <Text style={s.sortLabelText}>Sorted by</Text>
        <Pressable style={s.toolbarAction} onPress={onOpenSort} android_ripple={null}>
          <Text style={s.sortBold}>{sortLabel}</Text>
          <ArrowUpDown size={16} color={Colors.inkSecondary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={s.searchWrap}>
        <Search size={15} color={Colors.inkSecondary} strokeWidth={1.5} />
        <TextInput
          style={s.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.inkSecondary}
          value={query}
          onChangeText={onChangeQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => onChangeQuery('')} hitSlop={8} android_ripple={null}>
            <XIcon size={14} color={Colors.inkSecondary} />
          </Pressable>
        )}
      </View>
    </>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerName: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary,
  },

  toolbarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortLabelText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  toolbarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  sortBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkPrimary,
    padding: 0,
  },
})

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Pressable, Image,
} from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { Search, Users, X } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import ApiService from '@/api/apiService'
import type { DiscoverUser } from '@/api/apiService'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'
import type { SearchHistoryUser } from '@/store/searchHistoryStore'

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { history, add, remove, clear } = useSearchHistoryStore()

  // Clear search state when leaving the tab so history shows fresh on return
  useFocusEffect(useCallback(() => {
    return () => {
      setQuery('')
      setResults([])
      setSearched(false)
      setSearchError(false)
    }
  }, []))

  const runSearch = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setSearchError(false)
    try {
      const data = await ApiService.searchUsers(trimmed, 1, 10)
      // Boost previously tapped profiles to the top, preserving server order within each group
      const historyIds = new Set(history.map(h => h.id))
      const sorted = [
        ...data.users.filter(u => historyIds.has(u.id)),
        ...data.users.filter(u => !historyIds.has(u.id)),
      ]
      setResults(sorted)
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
      setSearchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      setSearchError(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(q), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const handleResultTap = (user: DiscoverUser) => {
    add({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.photos[0]?.url ?? null,
    })
    router.push(`/(profile)/${user.id}` as any)
  }

  const showHistory = !searched && query === '' && history.length > 0

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Search</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={[s.searchBar, focused && s.searchBarFocused]}>
          <Search size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search people by name or username..."
            placeholderTextColor={Colors.inkDisabled}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { hTap(); setQuery('') }} hitSlop={8}>
              <X size={16} color={Colors.inkDisabled} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <AutoSkeletonView isLoading animationType="gradient" defaultRadius={7}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={s.skRow}>
              <View style={s.skAvatar} />
              <View style={s.skInfo}>
                <View style={s.skLineName} />
                <View style={s.skLineUser} />
              </View>
            </View>
          ))}
        </AutoSkeletonView>
      ) : showHistory ? (
        <HistoryList
          history={history}
          onTap={(user) => router.push(`/(profile)/${user.id}` as any)}
          onRemove={(id) => { hTap(); remove(id) }}
          onClear={() => { hTap(); clear() }}
        />
      ) : !searched ? (
        <View style={s.center}>
          <Users size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Find people</Text>
          <Text style={s.emptySub}>Search by name or @username</Text>
        </View>
      ) : searchError ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Search failed</Text>
          <Text style={s.emptySub}>Check your connection and try again</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>No results</Text>
          <Text style={s.emptySub}>Try a different name or username</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={u => u.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <UserRow user={item} onTap={() => handleResultTap(item)} />
          )}
        />
      )}
    </View>
  )
}

// ── History list ──────────────────────────────────────────────────────────────

function HistoryList({
  history,
  onTap,
  onRemove,
  onClear,
}: {
  history: SearchHistoryUser[]
  onTap: (user: SearchHistoryUser) => void
  onRemove: (id: string) => void
  onClear: () => void
}) {
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
            <Image source={{ uri: item.avatar }} style={s.avatar} />
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

// ── Search result row ─────────────────────────────────────────────────────────

function UserRow({ user, onTap }: { user: DiscoverUser; onTap: () => void }) {
  const avatar = user.photos[0]?.url
  return (
    <Pressable style={s.row} onPress={onTap}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} />
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
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 28, color: Colors.inkPrimary },

  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchBarFocused: { borderColor: Colors.brandOrange + '55' },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },

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

  skRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  skAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2a2a2a' },
  skInfo: { flex: 1, gap: 8 },
  skLineName: { height: 14, width: '55%', borderRadius: 7, backgroundColor: '#2a2a2a' },
  skLineUser: { height: 12, width: '35%', borderRadius: 6, backgroundColor: '#2a2a2a' },

  listContent: { paddingBottom: 32 },
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

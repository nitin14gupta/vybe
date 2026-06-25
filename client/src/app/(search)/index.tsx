import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  TextInput, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { ChevronLeft, Search, UserPlus } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { DiscoverUser } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'

const PAGE_SIZE = 20

function useSearch() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<DiscoverUser[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string, pg: number, append = false) => {
    if (!q.trim()) {
      setUsers([])
      setHasMore(false)
      return
    }
    setLoading(true)
    try {
      const res = await ApiService.searchUsers(q, pg, PAGE_SIZE)
      setUsers(prev => append ? [...prev, ...res.users] : res.users)
      setHasMore(res.users.length === PAGE_SIZE)
      setPage(pg)
    } catch {}
    finally { setLoading(false) }
  }, [])

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      search(q, 1, false)
    }, 300)
  }, [search])

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    search(query, page + 1, true)
  }, [hasMore, loading, query, page, search])

  return { query, users, loading, hasMore, handleQueryChange, loadMore }
}

function UserRow({ user }: { user: DiscoverUser }) {
  const avatar = user.photos[0]?.url
  return (
    <Pressable
      style={s.row}
      onPress={() => router.push(`/(profile)/${user.id}` as any)}
    >
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={s.avatarInitial}>{(user.name ?? '?').charAt(0)}</Text>
        </View>
      )}
      <View style={s.rowBody}>
        <View style={s.nameRow}>
          <Text style={s.rowName} numberOfLines={1}>{user.name ?? 'User'}</Text>
          {user.username ? (
            <Text style={s.rowUsername}>@{user.username}</Text>
          ) : null}
        </View>
        <Text style={s.rowSub} numberOfLines={1}>
          {[user.city, user.age ? `${user.age} y/o` : null].filter(Boolean).join(' · ')}
        </Text>
        {user.interests?.length > 0 && (
          <Text style={s.rowInterests} numberOfLines={1}>
            {user.interests.slice(0, 3).join('  ·  ')}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const { query, users, loading, hasMore, handleQueryChange, loadMore } = useSearch()

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <View style={s.searchBar}>
          <Search size={15} color={Colors.inkDisabled} strokeWidth={1.8} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search people..."
            placeholderTextColor={Colors.inkDisabled}
            returnKeyType="search"
          />
          {loading && <ActivityIndicator size="small" color={Colors.brandOrange} />}
        </View>
      </View>

      {/* Results */}
      {!query.trim() ? (
        <View style={s.emptyState}>
          <Search size={44} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Find people</Text>
          <Text style={s.emptySub}>Search by name or city</Text>
        </View>
      ) : users.length === 0 && !loading ? (
        <View style={s.emptyState}>
          <UserPlus size={44} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No results</Text>
          <Text style={s.emptySub}>No one found for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={({ item }) => <UserRow user={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ListFooterComponent={
            hasMore ? (
              <View style={s.loadMore}>
                <ActivityIndicator color={Colors.brandOrange} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 6 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14, borderWidth: 1, borderColor: '#2a2a2a',
    paddingHorizontal: 14, height: 46, gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.inkPrimary,
  },
  list: { paddingBottom: 32 },
  loadMore: { paddingVertical: 20, alignItems: 'center' },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 40,
  },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 14,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: '#2a2a2a' },
  avatarFallback: { backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  rowBody: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  rowName: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowUsername: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.brandOrange },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  rowInterests: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.brandOrange, marginTop: 1 },
})

import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Pressable, Image, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Search, Users, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import type { DiscoverUser } from '@/api/apiService'

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await ApiService.searchUsers(q)
        setResults(data.users)
        setSearched(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Search</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Search size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search people by name or username..."
            placeholderTextColor={Colors.inkDisabled}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color={Colors.inkDisabled} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : !searched ? (
        <View style={s.center}>
          <Users size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Find people</Text>
          <Text style={s.emptySub}>Search by name or @username</Text>
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
          renderItem={({ item }) => <UserRow user={item} />}
        />
      )}
    </View>
  )
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
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{user.name ?? 'User'}</Text>
        {user.username ? (
          <Text style={s.username} numberOfLines={1}>@{user.username}</Text>
        ) : null}
        {user.city ? (
          <Text style={s.city} numberOfLines={1}>{user.city}</Text>
        ) : null}
      </View>
      {user.age ? (
        <Text style={s.age}>{user.age}</Text>
      ) : null}
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
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
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  listContent: { paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled },
  city: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  age: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
})

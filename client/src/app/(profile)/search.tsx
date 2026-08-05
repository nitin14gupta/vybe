import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { ArrowLeft, Users } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import type { DiscoverUser } from '@/api/apiService'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'
import { AppHeader, HeaderIconBtn, SearchBar } from '@/components/ui'
import { PeopleListSkeleton } from '@/components/profile/PeopleListSkeleton'
import { SearchHistoryList } from '@/components/profile/SearchHistoryList'
import { SearchResultRow } from '@/components/profile/SearchResultRow'

export default function SearchScreen() {
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
    <View style={s.root}>
      <AppHeader
        title="Search"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <View style={s.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          focused={focused}
          placeholder="Search people by name or username..."
          onSubmitEditing={() => runSearch(query)}
        />
      </View>

      {loading ? (
        <PeopleListSkeleton />
      ) : showHistory ? (
        <SearchHistoryList
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
            <SearchResultRow user={item} onTap={() => handleResultTap(item)} />
          )}
        />
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },

  listContent: { paddingBottom: 32 },
})

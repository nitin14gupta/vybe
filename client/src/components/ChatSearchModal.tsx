import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Modal, FlatList, Pressable, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, X, Users } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import { SearchBar } from '@/components/ui'
import { useChatSearchHistoryStore, type ChatSearchHistoryEntry } from '@/store/chatSearchHistoryStore'
import ApiService from '@/api/apiService'
import type { Conversation } from '@/api/apiService'

const RECENT_PREVIEW = 6
const SUGGESTIONS_MAX = 10

interface Props {
  visible: boolean
  onClose: () => void
  /** Mutually-connected people — the only pool this can search/suggest,
   * since chatting requires a mutual vybe (an active conversation). */
  conversations: Conversation[]
  onSelectConversation: (conv: Conversation) => void
}

function convToEntry(c: Conversation): ChatSearchHistoryEntry {
  return { id: c.id, name: c.partner_name, username: c.partner_username, avatar: c.partner_avatar }
}

function PersonRow({
  avatar, name, username, onPress, onRemove,
}: {
  avatar: string | null; name: string | null; username: string | null
  onPress: () => void; onRemove?: () => void
}) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={s.avatarInitial}>{(name ?? '?').charAt(0)}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{name ?? 'User'}</Text>
        {username ? <Text style={s.username} numberOfLines={1}>@{username}</Text> : null}
      </View>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10} style={s.removeBtn}>
          <X size={16} color={Colors.inkDisabled} strokeWidth={2} />
        </Pressable>
      )}
    </Pressable>
  )
}

export function ChatSearchModal({ visible, onClose, conversations, onSelectConversation }: Props) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [fullList, setFullList] = useState<Conversation[] | null>(null)
  const { history, add, remove, clear } = useChatSearchHistoryStore()

  // The passed-in `conversations` (from the visible inbox list) excludes any
  // chat you've deleted/hidden — but you're still mutually vybe-connected
  // with that person, so you should still be able to find them here and
  // start talking again. Fetch the full mutual pool (hidden included) once
  // the modal opens; show the fast prop-based list in the meantime.
  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ApiService.getConversations(100, 0, true)
      .then(res => { if (!cancelled) setFullList(res.active) })
      .catch(err => { if (!cancelled) console.warn('[ChatSearchModal] failed to load full mutual list:', err) })
    return () => { cancelled = true }
  }, [visible])

  const pool = fullList ?? conversations

  const handleSelect = (conv: Conversation) => {
    hTap()
    add(convToEntry(conv))
    setQuery('')
    setExpanded(false)
    onClose()
    onSelectConversation(conv)
  }

  const handleClose = () => {
    hTap()
    setQuery('')
    setExpanded(false)
    onClose()
  }

  const isSearching = query.trim().length > 0
  const suggestions = pool.slice(0, SUGGESTIONS_MAX)
  const recentToShow = expanded ? history : history.slice(0, RECENT_PREVIEW)
  const results = isSearching
    ? pool.filter(c => (c.partner_name ?? '').toLowerCase().includes(query.trim().toLowerCase()))
    : []

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[s.root, { paddingTop: insets.top + 12 }]}>
        <View style={s.header}>
          <Pressable onPress={handleClose} hitSlop={10} style={s.backBtn}>
            <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations..."
            autoFocus
            style={s.searchBar}
          />
        </View>

        {isSearching ? (
          <FlatList
            data={results}
            keyExtractor={c => c.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <PersonRow
                avatar={item.partner_avatar}
                name={item.partner_name}
                username={item.partner_username}
                onPress={() => handleSelect(item)}
              />
            )}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Users size={40} color={Colors.inkDisabled} strokeWidth={1.2} />
                <Text style={s.emptyText}>No conversations match</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={c => c.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.listContent}
            ListHeaderComponent={
              history.length > 0 ? (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Recent</Text>
                    <Pressable
                      onPress={() => {
                        hTap()
                        if (expanded) { clear() } else { setExpanded(true) }
                      }}
                      hitSlop={8}
                    >
                      <Text style={s.sectionAction}>{expanded ? 'Clear all' : 'See all'}</Text>
                    </Pressable>
                  </View>
                  {recentToShow.map(item => (
                    <PersonRow
                      key={item.id}
                      avatar={item.avatar}
                      name={item.name}
                      username={item.username}
                      onPress={() => {
                        const conv = pool.find(c => c.id === item.id)
                        if (conv) handleSelect(conv)
                        else remove(item.id)
                      }}
                      onRemove={() => { hTap(); remove(item.id) }}
                    />
                  ))}
                  <Text style={s.sectionTitle}>Suggested</Text>
                </View>
              ) : suggestions.length > 0 ? (
                <Text style={[s.sectionTitle, s.sectionTitleStandalone]}>Suggested</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <PersonRow
                avatar={item.partner_avatar}
                name={item.partner_name}
                username={item.partner_username}
                onPress={() => handleSelect(item)}
              />
            )}
            ListEmptyComponent={
              history.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Users size={40} color={Colors.inkDisabled} strokeWidth={1.2} />
                  <Text style={s.emptyText}>Vybe with people to start chatting</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: { flex: 1, height: 44, borderRadius: 12 },
  listContent: { paddingBottom: 32 },
  section: { marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitleStandalone: { paddingTop: 4 },
  sectionAction: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },
  removeBtn: { padding: 4 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})

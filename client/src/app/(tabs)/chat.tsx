import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  TextInput, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Search, MessageCircle, Flame } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { VybeInboxSheet } from '@/components/ui'
import { useConversations } from '@/hooks/useConversations'
import { Colors, FontFamily } from '@/constants'
import type { Conversation } from '@/api/apiService'

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatLastMessage(conv: Conversation): string {
  if (!conv.last_message) {
    if (conv.status === 'pending') return 'Sent a vybe...'
    return ''
  }
  if (conv.last_message_type === 'event') return '📅 Shared an event'
  if (conv.last_message_type === 'profile') return '👤 Shared a profile'
  if (conv.last_message_type === 'image') return '📷 Photo'
  return conv.last_message
}

// ── Conversation row ──────────────────────────────────────────────────────────

function ConvRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const isLocked = conv.status === 'pending'
  return (
    <Pressable onPress={onPress} style={[s.convRow, isLocked && s.convRowLocked]}>
      <View style={s.convAvatarWrap}>
        {conv.partner_avatar ? (
          <Image source={{ uri: conv.partner_avatar }} style={s.convAvatar} />
        ) : (
          <View style={[s.convAvatar, s.convAvatarFallback]}>
            <Text style={s.convAvatarInitial}>{(conv.partner_name ?? '?').charAt(0)}</Text>
          </View>
        )}
        {/* Online dot — shown when isPartnerOnline; omitted for now, real-time handled in chat */}
      </View>

      <View style={s.convBody}>
        <View style={s.convTopRow}>
          <Text style={[s.convName, isLocked && s.convNameLocked]} numberOfLines={1}>
            {conv.partner_name ?? 'User'}
          </Text>
          <Text style={[s.convTime, conv.unread_count > 0 && s.convTimeUnread]}>
            {formatTime(conv.last_sent_at ?? conv.last_message_at)}
          </Text>
        </View>
        <View style={s.convBottomRow}>
          <Text
            style={[s.convPreview, conv.unread_count > 0 && s.convPreviewUnread, isLocked && s.convPreviewLocked]}
            numberOfLines={1}
          >
            {isLocked ? '⏳ Pending vybe' : formatLastMessage(conv)}
          </Text>
          {conv.unread_count > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadText}>{conv.unread_count > 9 ? '9+' : conv.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

// ── Chat screen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [inboxOpen, setInboxOpen] = useState(false)

  const {
    activeConversations,
    lockedConversations,
    pendingVibes,
    loading,
    refresh,
    acceptVybe,
    passVybe,
  } = useConversations()

  // Active first (sorted by most recent message), locked at bottom
  const sortByRecent = (a: Conversation, b: Conversation) => {
    const ta = a.last_sent_at ?? a.last_message_at ?? a.id
    const tb = b.last_sent_at ?? b.last_message_at ?? b.id
    return tb.localeCompare(ta)
  }

  const allConvs = [
    ...activeConversations.slice().sort(sortByRecent),
    ...lockedConversations.slice().sort(sortByRecent),
  ]

  const filtered = search.trim()
    ? allConvs.filter(c =>
        (c.partner_name ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : allConvs

  const isEmpty = !loading && allConvs.length === 0 && pendingVibes.length === 0

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.title}>Messages</Text>
          {/* Vybe inbox badge button */}
          <Pressable style={s.inboxBtn} onPress={() => setInboxOpen(true)}>
            <Flame size={22} color={Colors.brandOrange} fill={Colors.brandOrange} />
            {pendingVibes.length > 0 && (
              <View style={s.inboxBadge}>
                <Text style={s.inboxBadgeText}>
                  {pendingVibes.length > 9 ? '9+' : pendingVibes.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={s.searchBar}>
          <Search size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search connections..."
            placeholderTextColor={Colors.inkDisabled}
          />
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : isEmpty ? (
        <View style={s.center}>
          <MessageCircle size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No chats yet</Text>
          <Text style={s.emptySub}>Send a Vybe to spark a conversation</Text>
          <Pressable onPress={() => router.navigate('/(tabs)/')} style={s.exploreBtn}>
            <Text style={s.exploreBtnText}>Explore</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={false}
          contentContainerStyle={s.listContent}
          ListHeaderComponent={null}
          renderItem={({ item }) => (
            <ConvRow
              conv={item}
              onPress={() => {
                if (item.status === 'active') {
                  router.push(`/(chat)/${item.id}` as any)
                }
              }}
            />
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.emptySub}>No conversations match your search</Text>
            </View>
          }
        />
      )}

      <VybeInboxSheet
        visible={inboxOpen}
        requests={pendingVibes}
        onAccept={(vibeId, icebreaker) => {
          acceptVybe(vibeId, icebreaker)
        }}
        onPass={(vibeId) => {
          passVybe(vibeId)
        }}
        onClose={() => setInboxOpen(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
  },
  inboxBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  inboxBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2, borderColor: Colors.background,
  },
  inboxBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: '#111' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  exploreBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.brandOrange,
  },
  exploreBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },
  listContent: { paddingBottom: 32 },

  // Pending strip
  pendingSection: { paddingBottom: 8, paddingTop: 12 },
  pendingSectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.brandOrange,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  pendingStrip: { paddingHorizontal: 20, gap: 16 },
  pendingItem: { alignItems: 'center', width: 64 },
  pendingRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: Colors.brandOrange,
    padding: 2,
    marginBottom: 6,
  },
  pendingAvatar: { width: '100%', height: '100%', borderRadius: 28 },
  pendingAvatarFallback: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingInitial: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  pendingName: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkSecondary,
    textAlign: 'center',
  },

  // Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  convRowLocked: { opacity: 0.55 },
  convAvatarWrap: { position: 'relative', marginRight: 14 },
  convAvatar: { width: 56, height: 56, borderRadius: 28 },
  convAvatarFallback: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  convBody: { flex: 1, minWidth: 0 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, flex: 1 },
  convNameLocked: { color: Colors.inkSecondary },
  convTime: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginLeft: 8 },
  convTimeUnread: { color: Colors.brandOrange },
  convBottomRow: { flexDirection: 'row', alignItems: 'center' },
  convPreview: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    flex: 1,
  },
  convPreviewUnread: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  convPreviewLocked: { color: Colors.inkDisabled },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  unreadText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: '#111' },
})

import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Flame, RefreshCw, Ghost, Search } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { VybeInboxSheet, VybeIcebreakerModal, LogoMark, ProfileMenuSheet } from '@/components/ui'
import { ChatSearchModal } from '@/components/chat/ChatSearchModal'
import { usePillStore } from '@/store/pillStore'
import { useConversations } from '@/hooks/useConversations'
import { useAuthStore } from '@/store/auth'
import ApiService from '@/api/apiService'
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

const MEDIA_PREVIEWS: Record<string, string> = {
  event: 'Shared an event',
  profile: 'Shared a profile',
  image: 'Photo',
  gif: 'GIF',
  video: 'Video',
  voice: 'Voice message',
}

function formatLastMessage(conv: Conversation, currentUserId: string | null): string {
  const isMine = !!currentUserId && conv.last_sender_id === currentUserId

  if (conv.last_unsent) {
    return isMine ? 'You unsent a message' : 'This message was unsent'
  }

  const prefix = isMine ? 'You: ' : ''

  const mediaPreview = conv.last_message_type ? MEDIA_PREVIEWS[conv.last_message_type] : undefined
  if (mediaPreview) return prefix + mediaPreview

  if (!conv.last_message) {
    if (conv.status === 'pending') return 'Sent a vybe...'
    return ''
  }
  return prefix + conv.last_message
}

// ── Conversation row ──────────────────────────────────────────────────────────

function ConvRow({ conv, onPress, onLongPress, onAvatarPress, currentUserId }: {
  conv: Conversation; onPress: () => void; onLongPress: () => void; onAvatarPress: () => void; currentUserId: string | null
}) {
  const isLocked   = conv.status === 'pending'
  const isDeleted  = conv.partner_is_deleted
  const displayName = conv.partner_name ?? 'User'

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={[s.convRow, isLocked && s.convRowLocked]}>
      <Pressable onPress={onAvatarPress} hitSlop={4} style={s.convAvatarWrap}>
        {isDeleted ? (
          <View style={[s.convAvatar, s.convAvatarDeleted]}>
            <Ghost size={20} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        ) : conv.partner_avatar ? (
          <Image source={{ uri: conv.partner_avatar }} style={s.convAvatar} />
        ) : (
          <View style={[s.convAvatar, s.convAvatarFallback]}>
            <Text style={s.convAvatarInitial}>{(conv.partner_name ?? '?').charAt(0)}</Text>
          </View>
        )}
      </Pressable>

      <View style={s.convBody}>
        <View style={s.convTopRow}>
          <Text style={[s.convName, isLocked && s.convNameLocked, isDeleted && s.convNameDeleted]} numberOfLines={1}>
            {displayName}
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
            {isLocked ? 'Pending vybe' : formatLastMessage(conv, currentUserId)}
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

// ── Loading skeleton ─────────────────────────────────────────────────────────

function ConvListSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={7} gradientColors={['#1e1e1e', '#2e2e2e']}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={s.skRow}>
          <View style={s.skAvatar} />
          <View style={s.skBody}>
            <View style={s.skTopRow}>
              <View style={s.skLineName} />
              <View style={s.skLineTime} />
            </View>
            <View style={s.skLinePreview} />
          </View>
        </View>
      ))}
    </AutoSkeletonView>
  )
}

// ── Chat screen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const [inboxOpen, setInboxOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingAccept, setPendingAccept] = useState<{ vibeId: string; name: string | null } | null>(null)
  const [menuTarget, setMenuTarget] = useState<Conversation | null>(null)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())

  const showPill = usePillStore(s => s.show)
  const currentUserId = useAuthStore(s => s.userId)

  const {
    activeConversations,
    lockedConversations,
    pendingVibes,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    acceptVybe,
    passVybe,
  } = useConversations()

  // Refresh received vybes every time the inbox sheet is opened
  useEffect(() => { if (inboxOpen) refresh() }, [inboxOpen])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

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

  const isEmpty = !loading && !error && allConvs.length === 0 && pendingVibes.length === 0

  const openConversation = (item: Conversation) => {
    if (item.status === 'active') {
      router.push(`/(chat)/${item.id}` as any)
    } else {
      router.push({
        pathname: '/(chat)/pending' as any,
        params: {
          partnerId: item.partner_id,
          partnerName: item.partner_name ?? '',
          partnerAvatar: item.partner_avatar ?? '',
          message: item.last_message ?? '',
        },
      })
    }
  }

  const openProfile = (item: Conversation) => {
    if (item.partner_is_deleted) return
    hTap()
    router.push(`/(profile)/${item.partner_id}` as any)
  }

  const handleBlock = async () => {
    if (!menuTarget) return
    await ApiService.blockUser(menuTarget.partner_id)
    setBlockedIds(prev => new Set(prev).add(menuTarget.partner_id))
  }

  const handleUnblock = async () => {
    if (!menuTarget) return
    await ApiService.unblockUser(menuTarget.partner_id)
    setBlockedIds(prev => { const next = new Set(prev); next.delete(menuTarget.partner_id); return next })
  }

  const handleReport = async (reason: string) => {
    if (!menuTarget) return
    await ApiService.reportUser(menuTarget.partner_id, reason)
  }

  const isTargetBlocked = !!menuTarget && (blockedIds.has(menuTarget.partner_id) || menuTarget.block_status === 'i_blocked')

  return (
    <View style={[s.root, { paddingTop: insets.top + 4 }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.title}>Messages</Text>
          {/* Vybe inbox badge button */}
          <Pressable style={s.inboxBtn} onPress={() => { hTap(); setInboxOpen(true) }}>
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
        <Pressable style={s.searchBar} onPress={() => { hTap(); setSearchOpen(true) }}>
          <Search size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
          <Text style={s.searchBarText}>Search conversations...</Text>
        </Pressable>
      </View>

      {loading ? (
        <ConvListSkeleton />
      ) : error ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Couldn't load messages</Text>
          <Text style={s.emptySub}>Check your connection and try again</Text>
          <Pressable onPress={() => { hTap(); refresh() }} style={s.retryBtn} android_ripple={null}>
            <RefreshCw size={16} color={Colors.brandOrange} strokeWidth={1.8} />
            <Text style={s.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <View style={s.center}>
          <LogoMark size={72} opacity={0.1} style={{ marginBottom: 4 }} />
          <Text style={s.emptyTitle}>No chats yet</Text>
          <Text style={s.emptySub}>Send a Vybe to spark a conversation</Text>
          <Pressable onPress={() => router.navigate('/(tabs)/')} style={s.exploreBtn}>
            <Text style={s.exploreBtnText}>Explore</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={allConvs}
          keyExtractor={c => c.id}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={s.listContent}
          ListHeaderComponent={null}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadMore()
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.footerLoading}>
                <ActivityIndicator color={Colors.brandOrange} size="small" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ConvRow
              conv={item}
              currentUserId={currentUserId}
              onPress={() => openConversation(item)}
              onLongPress={() => { hTap(); setMenuTarget(item) }}
              onAvatarPress={() => openProfile(item)}
            />
          )}
        />
      )}

      <VybeInboxSheet
        visible={inboxOpen}
        requests={pendingVibes}
        loading={loading && pendingVibes.length === 0}
        onBeginAccept={(vibeId, name) => {
          setInboxOpen(false)
          setPendingAccept({ vibeId, name })
        }}
        onPass={async (vibeId) => {
          try {
            await passVybe(vibeId)
          } catch {
            showPill("Couldn't pass right now, try again", 'error')
          }
        }}
        onClose={() => setInboxOpen(false)}
      />

      <VybeIcebreakerModal
        visible={!!pendingAccept}
        partnerName={pendingAccept?.name ?? null}
        onSend={async (icebreaker) => {
          if (!pendingAccept) return
          const { vibeId } = pendingAccept
          setPendingAccept(null)
          try {
            await acceptVybe(vibeId, icebreaker)
          } catch {
            showPill("Couldn't accept that vybe, try again", 'error')
          }
        }}
        onClose={() => setPendingAccept(null)}
      />

      <ChatSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        conversations={activeConversations}
        onSelectConversation={openConversation}
      />

      {menuTarget && (
        <ProfileMenuSheet
          visible={!!menuTarget}
          userId={menuTarget.partner_id}
          username={menuTarget.partner_username}
          targetName={menuTarget.partner_name}
          avatarUrl={menuTarget.partner_avatar}
          isBlocked={isTargetBlocked}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onReport={handleReport}
          onClose={() => setMenuTarget(null)}
        />
      )}
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
    // backgroundColor: 'rgba(255,107,53,0.12)',
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
    gap: 10,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchBarText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkDisabled,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  footerLoading: { paddingVertical: 20, alignItems: 'center' },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.brandOrange,
  },
  retryBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },
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

  // Loading skeleton
  skRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  skAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a2a' },
  skBody: { flex: 1, gap: 8 },
  skTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skLineName: { height: 14, width: '45%', borderRadius: 7, backgroundColor: '#2a2a2a' },
  skLineTime: { height: 11, width: 36, borderRadius: 6, backgroundColor: '#2a2a2a' },
  skLinePreview: { height: 12, width: '70%', borderRadius: 6, backgroundColor: '#2a2a2a' },

  // Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  convRowLocked: { opacity: 0.75 },
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
  convNameDeleted: { color: Colors.inkDisabled, fontStyle: 'italic' },
  convAvatarDeleted: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
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

import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, SectionList, Pressable,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native'
import { hTap } from '@/lib/haptics'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, Bell, Calendar, Star, Users, Clock, PartyPopper } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { AppNotification } from '@/api/apiService'
import { useNotifStore } from '@/store/notifStore'
import { Colors, FontFamily } from '@/constants'

const TYPE_CONFIG: Record<string, { color: string; Icon: any }> = {
  rsvp:                     { color: Colors.accentGreen,  Icon: Calendar },
  review:                   { color: Colors.accentGold,   Icon: Star },
  waitlist_accepted:        { color: Colors.brandOrange,  Icon: PartyPopper },
  waitlist_joined:          { color: Colors.inkSecondary, Icon: Clock },
  waitlist_expired:         { color: Colors.inkDisabled,  Icon: Clock },
  waitlist_event_cancelled: { color: Colors.brandCoral,   Icon: Calendar },
  follow:                   { color: Colors.brandOrange,  Icon: Users },
  default:                  { color: Colors.brandOrange,  Icon: Bell },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function groupByDate(notifs: AppNotification[]): { title: string; data: AppNotification[] }[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000
  const weekStart = todayStart - 6 * 86400000

  const groups: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  }

  for (const n of notifs) {
    const t = new Date(n.created_at).getTime()
    if (t >= todayStart) groups['Today'].push(n)
    else if (t >= yesterdayStart) groups['Yesterday'].push(n)
    else if (t >= weekStart) groups['This Week'].push(n)
    else groups['Earlier'].push(n)
  }

  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }))
}

function NotifRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const unread = !item.read_at
  const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.default
  const TypeIcon = typeConf.Icon

  return (
    <Pressable
      style={({ pressed }) => [s.row, unread && s.rowUnread, pressed && s.rowPressed]}
      onPress={() => { hTap(); onPress() }}
    >
      {unread && <View style={s.unreadBar} />}

      <View style={s.avatarWrap}>
        {item.actor_avatar ? (
          <Image source={{ uri: item.actor_avatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Bell size={18} color={Colors.inkSecondary} strokeWidth={1.5} />
          </View>
        )}
        <View style={[s.typeBadge, { backgroundColor: typeConf.color }]}>
          <TypeIcon size={9} color="#fff" strokeWidth={2.5} />
        </View>
      </View>

      <View style={s.content}>
        <View style={s.topRow}>
          <Text style={[s.title, unread && s.titleUnread]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[s.timePill, unread && s.timePillUnread]}>
            <Text style={[s.timeText, unread && s.timeTextUnread]}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
        {item.body ? (
          <Text style={s.body} numberOfLines={2}>{item.body}</Text>
        ) : null}
      </View>
    </Pressable>
  )
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const markAllRead = useNotifStore(s => s.markAllRead)
  const cursorRef = useRef<string | undefined>(undefined)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    cursorRef.current = undefined
    try {
      const data = await ApiService.getNotifications()
      setNotifs(data)
      setHasMore(data.length === 10)
      if (data.length > 0) cursorRef.current = data[data.length - 1].created_at
    } catch {}
    finally { setLoading(false) }
  }, [])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const data = await ApiService.getNotifications(cursorRef.current)
      setNotifs(prev => [...prev, ...data])
      setHasMore(data.length === 10)
      if (data.length > 0) cursorRef.current = data[data.length - 1].created_at
    } catch {}
    finally { setLoadingMore(false) }
  }, [])

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadInitial()
    setRefreshing(false)
  }, [loadInitial])

  useFocusEffect(useCallback(() => { loadInitial() }, [loadInitial]))

  const handleMarkAll = async () => {
    await ApiService.markAllNotificationsRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    markAllRead()
  }

  const NON_NAVIGABLE_TYPES = ['waitlist_expired', 'waitlist_event_cancelled']

  const handleTap = async (item: AppNotification) => {
    if (!item.read_at) {
      await ApiService.markNotificationRead(item.id).catch(() => {})
      setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
    }
    if (NON_NAVIGABLE_TYPES.includes(item.type)) return
    if (item.entity_type === 'event' && item.entity_id) {
      router.push(`/(events)/${item.entity_id}` as any)
    } else if (item.entity_type === 'user' && item.entity_id) {
      router.push(`/(profile)/${item.entity_id}` as any)
    }
  }

  const unreadCount = notifs.filter(n => !n.read_at).length
  const sections = groupByDate(notifs)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <ChevronLeft size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <Pressable onPress={() => { hTap(); handleMarkAll() }} hitSlop={8}>
            <Text style={s.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} size="large" />
        </View>
      ) : notifs.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconRing}>
            <Bell size={36} color={Colors.brandOrange} strokeWidth={1.5} />
          </View>
          <Text style={s.emptyTitle}>All caught up</Text>
          <Text style={s.emptySub}>We'll let you know when something happens</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={n => n.id}
          renderItem={({ item }) => <NotifRow item={item} onPress={() => handleTap(item)} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.brandOrange}
              colors={[Colors.brandOrange]}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionLabel}>{section.title}</Text>
              <View style={s.sectionLine} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListFooterComponent={
            hasMore ? (
              <Pressable style={s.loadMoreBtn} onPress={() => { if (!loadingMore) loadMore() }}>
                {loadingMore
                  ? <ActivityIndicator color={Colors.brandOrange} size="small" />
                  : <Text style={s.loadMoreText}>Load more</Text>}
              </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkPrimary,
    letterSpacing: -0.2,
  },
  unreadBadge: {
    backgroundColor: Colors.brandOrange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#fff',
  },
  markAllText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
    width: 80,
    textAlign: 'right',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.inkDisabled,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: 80,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    position: 'relative',
  },
  rowUnread: {
    backgroundColor: 'rgba(255,107,53,0.05)',
  },
  rowPressed: {
    backgroundColor: Colors.surface,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.brandOrange,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  avatarWrap: { position: 'relative', marginTop: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },

  content: { flex: 1, gap: 3 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 20,
  },
  titleUnread: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.inkPrimary,
  },
  timePill: {
    backgroundColor: Colors.elevated,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 1,
  },
  timePillUnread: {
    backgroundColor: 'rgba(255,107,53,0.15)',
  },
  timeText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
  },
  timeTextUnread: {
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodySemiBold,
  },
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    lineHeight: 18,
  },

  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 4,
  },
  loadMoreText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.brandOrange,
  },
})

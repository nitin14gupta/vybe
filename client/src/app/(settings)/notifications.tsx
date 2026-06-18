import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Image,
} from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, Bell } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { AppNotification } from '@/api/apiService'
import { useNotifStore } from '@/store/notifStore'
import { Colors, FontFamily } from '@/constants'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotifRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const unread = !item.read_at
  return (
    <Pressable style={[s.row, unread && s.rowUnread]} onPress={onPress}>
      <View style={s.avatarWrap}>
        {item.actor_avatar ? (
          <Image source={{ uri: item.actor_avatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Bell size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
        {unread && <View style={s.unreadDot} />}
      </View>
      <View style={s.textBlock}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        {item.body ? <Text style={s.body} numberOfLines={2}>{item.body}</Text> : null}
        <Text style={s.time}>{timeAgo(item.created_at)}</Text>
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

  useFocusEffect(useCallback(() => { loadInitial() }, [loadInitial]))

  const handleMarkAll = async () => {
    await ApiService.markAllNotificationsRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    markAllRead()
  }

  const handleTap = async (item: AppNotification) => {
    if (!item.read_at) {
      await ApiService.markNotificationRead(item.id).catch(() => {})
      setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
    }
    if (item.entity_type === 'event' && item.entity_id) {
      router.push(`/(events)/${item.entity_id}` as any)
    } else if (item.entity_type === 'user' && item.entity_id) {
      router.push(`/(profile)/${item.entity_id}` as any)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    loadMore()
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        <Pressable onPress={handleMarkAll} hitSlop={8}>
          <Text style={s.markAllText}>Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : notifs.length === 0 ? (
        <View style={s.center}>
          <Bell size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No notifications yet</Text>
          <Text style={s.emptySub}>We'll let you know when something happens</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={n => n.id}
          renderItem={({ item }) => <NotifRow item={item} onPress={() => handleTap(item)} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListFooterComponent={
            hasMore ? (
              <Pressable style={s.loadMoreBtn} onPress={handleLoadMore}>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  markAllText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandOrange },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 14, gap: 14,
  },
  rowUnread: { backgroundColor: 'rgba(255,107,53,0.07)' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.brandOrange,
    borderWidth: 2, borderColor: Colors.background,
  },
  textBlock: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary, lineHeight: 20 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  time: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginTop: 2 },

  loadMoreBtn: {
    alignItems: 'center', paddingVertical: 16,
  },
  loadMoreText: {
    fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange,
  },
})

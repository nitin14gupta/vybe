import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, SectionList, Pressable,
  ActivityIndicator, Image,
} from 'react-native'
import { hTap } from '@/lib/haptics'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, Bell } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { AppNotification } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'

// ── Dev-only mock data — lets us eyeball every notification type/copy at once ──
// (__DEV__ gated below; never shows in a production build)
const MOCK_AVATAR = (n: number) => `https://i.pravatar.cc/150?img=${n}`

function buildMockNotifications(): AppNotification[] {
  const now = Date.now()
  const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString()
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString()

  return [
    { id: 'mock-vybe_request', type: 'vybe_request', actor_id: 'u1', actor_name: 'Ava', actor_avatar: MOCK_AVATAR(1), entity_id: 'u1', entity_type: 'user', title: 'Ava sent you a Vybe!', body: null, read_at: null, created_at: hoursAgo(0.1) },
    { id: 'mock-vybe_accepted', type: 'vybe_accepted', actor_id: 'u2', actor_name: 'Liam', actor_avatar: MOCK_AVATAR(2), entity_id: 'u2', entity_type: 'user', title: 'Liam accepted your Vybe!', body: null, read_at: null, created_at: hoursAgo(1) },
    { id: 'mock-new_follower', type: 'new_follower', actor_id: 'u3', actor_name: 'Zoe', actor_avatar: MOCK_AVATAR(3), entity_id: 'u3', entity_type: 'user', title: 'Zoe started following you', body: null, read_at: hoursAgo(3), created_at: hoursAgo(2) },
    { id: 'mock-event_created_confirmation', type: 'event_created_confirmation', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e1', entity_type: 'event', title: 'Your event is live!', body: 'Rooftop Mixer was posted successfully.', read_at: null, created_at: hoursAgo(4) },
    { id: 'mock-event_created', type: 'event_created', actor_id: 'u4', actor_name: 'Maya', actor_avatar: MOCK_AVATAR(4), entity_id: 'e2', entity_type: 'event', title: 'Maya just posted an event', body: 'Sunset Rooftop Party', read_at: hoursAgo(7), created_at: hoursAgo(6) },
    { id: 'mock-event_rsvp', type: 'event_rsvp', actor_id: 'u5', actor_name: 'Noah', actor_avatar: MOCK_AVATAR(5), entity_id: 'e1', entity_type: 'event', title: 'Noah is going to Rooftop Mixer', body: null, read_at: null, created_at: hoursAgo(9) },
    { id: 'mock-ticket_sold', type: 'ticket_sold', actor_id: 'u6', actor_name: 'Priya', actor_avatar: MOCK_AVATAR(6), entity_id: 'e1', entity_type: 'event', title: 'Priya bought a ticket!', body: "Someone's going to Rooftop Mixer.", read_at: hoursAgo(20), created_at: hoursAgo(18) },
    { id: 'mock-event_updated', type: 'event_updated', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e1', entity_type: 'event', title: 'Event details changed', body: "The host updated Rooftop Mixer. Check what's new.", read_at: null, created_at: daysAgo(1) },
    { id: 'mock-waitlist_promoted', type: 'waitlist_promoted', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e3', entity_type: 'event', title: 'A spot opened up!', body: 'You have 1 hour to confirm your spot at Beach Bonfire.', read_at: null, created_at: daysAgo(1.5) },
    { id: 'mock-waitlist_expired', type: 'waitlist_expired', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e3', entity_type: 'event', title: 'Spot offer expired', body: 'Your reserved spot at Beach Bonfire was given to the next person.', read_at: daysAgo(2), created_at: daysAgo(2) },
    { id: 'mock-event_review', type: 'event_review', actor_id: 'u7', actor_name: 'Kai', actor_avatar: MOCK_AVATAR(7), entity_id: 'e4', entity_type: 'event', title: 'Kai left a 5-star review', body: 'Warehouse Rave', read_at: daysAgo(3), created_at: daysAgo(3) },
    { id: 'mock-event_sold_out', type: 'event_sold_out', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e4', entity_type: 'event', title: 'Your event sold out!', body: 'Warehouse Rave has no spots left.', read_at: null, created_at: daysAgo(4) },
    { id: 'mock-payment_confirmed', type: 'payment_confirmed', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e4', entity_type: 'event', title: 'Payment confirmed!', body: 'Your ticket for Warehouse Rave is ready.', read_at: daysAgo(5), created_at: daysAgo(5) },
    { id: 'mock-event_cancelled', type: 'event_cancelled', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e5', entity_type: 'event', title: 'Event cancelled', body: 'Beach Bonfire was cancelled by the host.', read_at: daysAgo(8), created_at: daysAgo(8) },
    { id: 'mock-waitlist_event_cancelled', type: 'waitlist_event_cancelled', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e5', entity_type: 'event', title: 'Event cancelled', body: "Beach Bonfire was cancelled. You've been removed from the waitlist.", read_at: daysAgo(9), created_at: daysAgo(9) },
    { id: 'mock-report_submitted', type: 'report_submitted', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e5', entity_type: 'event', title: 'Report submitted', body: "Thanks for letting us know — our team will review it shortly.", read_at: daysAgo(10), created_at: daysAgo(10) },
  ]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
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
  return (
    <Pressable style={[s.row, unread && s.rowUnread]} onPress={() => { hTap(); onPress() }}>
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

  const loadMock = () => {
    setNotifs(buildMockNotifications())
    setHasMore(false)
    setLoading(false)
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

  const sections = groupByDate(notifs)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        {__DEV__ ? (
          <Pressable onPress={() => { hTap(); loadMock() }} style={s.backBtn} hitSlop={8}>
            <Text style={s.devMockText}>Mock</Text>
          </Pressable>
        ) : (
          <View style={s.backBtn} />
        )}
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
        <SectionList
          sections={sections}
          keyExtractor={n => n.id}
          renderItem={({ item }) => <NotifRow item={item} onPress={() => handleTap(item)} />}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          stickySectionHeadersEnabled={false}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14
  },
  backBtn: { padding: 4, width: 32 },
  devMockText: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.inkSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
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
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },
})

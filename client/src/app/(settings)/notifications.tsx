import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, SectionList, Pressable,
  ActivityIndicator, Image,
} from 'react-native'
import { hTap } from '@/lib/haptics'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, Bell, UserPlus, Flame, MessageCircle } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { AppNotification } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'
import { notifEntityToTarget, targetToHref } from '@/lib/deepLink'
import { OutlineButton, PrimaryButton } from '@/components/ui'

const MOCK_AVATAR = (n: number) => `https://i.pravatar.cc/150?img=${n}`

function buildMockNotifications(): AppNotification[] {
  const now = Date.now()
  const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString()
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString()

  return [
    { id: 'mock-vybe_request', type: 'vybe_request', actor_id: 'u1', actor_name: 'Ava', actor_avatar: MOCK_AVATAR(1), entity_id: 'u1', entity_type: 'user', title: 'Ava sent you a Vybe!', body: null, read_at: null, created_at: hoursAgo(0.1), action: 'follow', action_label: 'Follow Back', action_target_id: 'u1' },
    { id: 'mock-vybe_accepted', type: 'vybe_accepted', actor_id: 'u2', actor_name: 'Liam', actor_avatar: MOCK_AVATAR(2), entity_id: 'u2', entity_type: 'user', title: 'Liam accepted your Vybe!', body: null, read_at: null, created_at: hoursAgo(1), action: 'message', action_label: 'Message', action_target_id: 'mock-conv-1' },
    { id: 'mock-new_follower-followback', type: 'new_follower', actor_id: 'u3', actor_name: 'Zoe', actor_avatar: MOCK_AVATAR(3), entity_id: 'u3', entity_type: 'user', title: 'Zoe started following you', body: null, read_at: null, created_at: hoursAgo(2), action: 'follow', action_label: 'Follow Back', action_target_id: 'u3' },
    { id: 'mock-new_follower-send_vybe', type: 'new_follower', actor_id: 'u8', actor_name: 'Ben', actor_avatar: MOCK_AVATAR(8), entity_id: 'u8', entity_type: 'user', title: 'Ben started following you', body: null, read_at: hoursAgo(3), created_at: hoursAgo(3), action: 'send_vybe', action_label: 'Send Vybe', action_target_id: 'u8' },
    { id: 'mock-new_follower-message', type: 'new_follower', actor_id: 'u9', actor_name: 'Ria', actor_avatar: MOCK_AVATAR(9), entity_id: 'u9', entity_type: 'user', title: 'Ria started following you', body: null, read_at: hoursAgo(4), created_at: hoursAgo(3.5), action: 'message', action_label: 'Message', action_target_id: 'mock-conv-2' },
    { id: 'mock-event_created_confirmation', type: 'event_created_confirmation', actor_id: null, actor_name: null, actor_avatar: null, entity_id: 'e1', entity_type: 'event', title: 'Your event is live!', body: 'Rooftop Mixer was posted successfully.', read_at: null, created_at: hoursAgo(4), cover_photo: 'https://picsum.photos/seed/vybe-rooftop/400/225' },
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

// Same icon language as the profile screen's CTA bar (client/src/app/(profile)/[id].tsx)
// — UserPlus for Follow/Follow Back, Flame for Send Vybe, MessageCircle for Message.
const ACTION_ICON: Record<string, any> = {
  follow: UserPlus,
  send_vybe: Flame,
  message: MessageCircle,
}

function NotifRow({ item, onPress, onAction }: {
  item: AppNotification
  onPress: () => void
  onAction: (item: AppNotification) => void
}) {
  const unread = !item.read_at
  const ActionIcon = item.action ? ACTION_ICON[item.action] : null
  // Send Vybe / Message mirror the profile screen's primary (filled orange) CTA;
  // Follow/Follow Back mirrors its secondary (outlined) CTA.
  const isPrimary = item.action === 'send_vybe' || item.action === 'message'

  return (
    <View style={[s.row, unread && s.rowUnread]}>
      <Pressable style={s.rowMain} onPress={() => { hTap(); onPress() }}>
        <View style={s.avatarWrap}>
          {item.cover_photo ? (
            <Image source={{ uri: item.cover_photo }} style={s.coverThumb} resizeMode="cover" />
          ) : item.actor_avatar ? (
            <Image source={{ uri: item.actor_avatar }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Bell size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
            </View>
          )}
          {unread && <View style={s.unreadDot} />}
        </View>
        <View style={s.textBlock}>
          <Text style={s.title}>{item.title}</Text>
          {item.body ? <Text style={s.body}>{item.body}</Text> : null}
          <Text style={s.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </Pressable>

      {item.action && item.action_label && ActionIcon ? (
        <View style={s.actionBtnWrap}>
          {isPrimary ? (
            <PrimaryButton
              label={item.action_label}
              onPress={() => onAction(item)}
              icon={<ActionIcon size={14} color="#111" strokeWidth={2} />}
              size="small"
            />
          ) : (
            <OutlineButton
              label={item.action_label}
              onPress={() => onAction(item)}
              icon={<ActionIcon size={14} color={Colors.inkPrimary} strokeWidth={2} />}
              size="small"
            />
          )}
        </View>
      ) : null}
    </View>
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
    } catch { }
    finally { setLoading(false) }
  }, [])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const data = await ApiService.getNotifications(cursorRef.current)
      setNotifs(prev => [...prev, ...data])
      setHasMore(data.length === 10)
      if (data.length > 0) cursorRef.current = data[data.length - 1].created_at
    } catch { }
    finally { setLoadingMore(false) }
  }, [])

  useFocusEffect(useCallback(() => { loadInitial() }, [loadInitial]))

  const loadMock = () => {
    setNotifs(buildMockNotifications())
    setHasMore(false)
    setLoading(false)
  }

  const markRead = async (item: AppNotification) => {
    if (item.read_at) return
    await ApiService.markNotificationRead(item.id).catch(() => { })
    setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const handleTap = async (item: AppNotification) => {
    await markRead(item)
    const target = notifEntityToTarget(item.entity_type, item.entity_id)
    if (target) router.push(targetToHref(target) as any)
  }

  const handleAction = async (item: AppNotification) => {
    hTap()
    await markRead(item)
    if (!item.action_target_id) return

    if (item.action === 'follow') {
      // Optimistic — hide the button immediately, revert if the request fails
      setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, action: null, action_label: null } : n))
      try {
        await ApiService.followUser(item.action_target_id)
      } catch {
        setNotifs(prev => prev.map(n => n.id === item.id
          ? { ...n, action: item.action, action_label: item.action_label }
          : n))
      }
    } else if (item.action === 'send_vybe') {
      router.push(targetToHref({ screen: 'profile', id: item.action_target_id }) as any)
    } else if (item.action === 'message') {
      router.push(targetToHref({ screen: 'chat', id: item.action_target_id }) as any)
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
          renderItem={({ item }) => (
            <NotifRow item={item} onPress={() => handleTap(item)} onAction={handleAction} />
          )}
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 10,
  },
  rowUnread: { backgroundColor: 'rgba(255,107,53,0.07)' },
  rowMain: {
    flex: 1,
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  // Event cover photos are 16:9 — a circular crop mangles them, so these get a
  // small rounded-rect thumbnail instead (cropped via resizeMode="cover").
  coverThumb: { width: 56, height: 40, borderRadius: 10 },
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
  // minWidth: 0 keeps this from growing past its share when the action button
  // sits alongside it (RN flex-row-with-Text overflow quirk).
  textBlock: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary, lineHeight: 20 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  time: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginTop: 2 },
  actionBtnWrap: {
    marginLeft: 'auto',
  },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },
})

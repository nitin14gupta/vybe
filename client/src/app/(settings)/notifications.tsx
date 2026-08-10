import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, SectionList, Pressable,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { ArrowLeft } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { AppNotification } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'
import { notifEntityToTarget, targetToHref } from '@/lib/deepLink'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { NotificationRow } from '@/components/settings/NotificationRow'
import { NotificationsEmptyState, NotificationsErrorState } from '@/components/settings/NotificationsStatusViews'

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

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const { hideProgress, onScroll } = useHeaderScroll()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const cursorRef = useRef<string | undefined>(undefined)
  const showPill = usePillStore(s => s.show)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    cursorRef.current = undefined
    try {
      const data = await ApiService.getNotifications()
      setNotifs(data)
      setHasMore(data.length === 10)
      if (data.length > 0) cursorRef.current = data[data.length - 1].created_at
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const data = await ApiService.getNotifications(cursorRef.current)
      setNotifs(prev => [...prev, ...data])
      setHasMore(data.length === 10)
      if (data.length > 0) cursorRef.current = data[data.length - 1].created_at
    } catch {
      showPill("Couldn't load more, try again", 'error')
    } finally {
      setLoadingMore(false)
    }
  }, [showPill])

  useFocusEffect(useCallback(() => { loadInitial() }, [loadInitial]))

  const markRead = async (item: AppNotification) => {
    if (item.read_at) return
    await ApiService.markNotificationRead(item.id).catch(() => { })
    setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const handleDismiss = async (item: AppNotification) => {
    // Optimistic — gone immediately, restored if the request fails.
    setNotifs(prev => prev.filter(n => n.id !== item.id))
    try {
      await ApiService.dismissNotification(item.id)
    } catch {
      setNotifs(prev => [...prev, item].sort((a, b) => b.created_at.localeCompare(a.created_at)))
      showPill("Couldn't dismiss, try again", 'error')
    }
  }

  const handleTap = async (item: AppNotification) => {
    await markRead(item)
    if (item.type === 'host_onboarding_complete') {
      router.push('/(events)/create' as any)
      return
    }
    // Host got a "raise your capacity" nudge — take them straight to the
    // edit screen where they can actually do that, not just the read-only view.
    if (item.type === 'host_low_capacity' && item.entity_id) {
      router.push(`/(events)/${item.entity_id}/edit` as any)
      return
    }
    // Ticket-related notifications point at the ticket screen, not just the
    // event detail page — that's the whole point of tapping them.
    if ((item.type === 'payment_confirmed' || item.type === 'rsvp_confirmed') && item.entity_id) {
      router.push(`/(events)/${item.entity_id}/ticket` as any)
      return
    }
    const target = notifEntityToTarget(item.entity_type, item.entity_id)
    if (target) router.push(targetToHref(target, useAuthStore.getState().userId) as any)
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
        showPill("Couldn't follow, try again", 'error')
      }
    } else if (item.action === 'send_vybe') {
      router.push(targetToHref({ screen: 'profile', id: item.action_target_id }) as any)
    } else if (item.action === 'message') {
      router.push(targetToHref({ screen: 'chat', id: item.action_target_id }) as any)
    }
  }

  const sections = groupByDate(notifs)

  return (
    <View style={s.root}>
      <AppHeader
        title="Notifications"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : loadError ? (
        <NotificationsErrorState onRetry={loadInitial} />
      ) : notifs.length === 0 ? (
        <NotificationsEmptyState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={n => n.id}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => handleTap(item)} onAction={handleAction} onDismiss={() => handleDismiss(item)} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 20 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
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
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },
})

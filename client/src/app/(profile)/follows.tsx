import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowUpDown, ChevronLeft, Search, Users, X as XIcon } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { ReportSheet, BlockSheet, SortSheet, DotsSheet, ConfirmSheet } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'
import { useFollowsList } from '@/hooks/useFollowsList'
import { UserFollowCard } from '@/components/profile/UserFollowCard'
import ApiService from '@/api/apiService'
import type { FollowUser } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

type SortKey = 'default' | 'az' | 'za' | 'earliest'
const SORT_OPTIONS: SortOption<SortKey>[] = [
  { key: 'default',  label: 'Default (Recent)' },
  { key: 'az',       label: 'Name A → Z' },
  { key: 'za',       label: 'Name Z → A' },
  { key: 'earliest', label: 'Earliest first' },
]

const DOTS_ACTIONS = [
  { key: 'report', label: 'Report' },
  { key: 'block',  label: 'Block', destructive: true },
]

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FollowsScreen() {
  const { userId, type, name, vibersCount, vibingCount } = useLocalSearchParams<{
    userId: string
    type: string
    name: string
    vibersCount: string
    vibingCount: string
  }>()

  const insets = useSafeAreaInsets()
  const goBack = useGoBack()
  const showPill = usePillStore(s => s.show)

  const initTab: 'followers' | 'following' = type === 'following' ? 'following' : 'followers'
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initTab)
  const [sort, setSort] = useState<SortKey>('default')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)
  const [dotsTarget, setDotsTarget] = useState<FollowUser | null>(null)
  const [reportTarget, setReportTarget] = useState<FollowUser | null>(null)
  const [blockTarget, setBlockTarget] = useState<FollowUser | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ user: FollowUser; action: 'unfollow' | 'remove' } | null>(null)

  const displayName = decodeURIComponent(name ?? '')

  // Both lists load in parallel — instant tab switching
  const followersList = useFollowsList(userId, 'followers')
  const followingList = useFollowsList(userId, 'following')
  const active = activeTab === 'followers' ? followersList : followingList

  // Tab count: prefer live count from loaded data, fall back to param
  const liveVibersCount = followersList.loading ? parseInt(vibersCount ?? '0', 10) : followersList.totalCount
  const liveVibingCount = followingList.loading ? parseInt(vibingCount ?? '0', 10) : followingList.totalCount

  // Apply sort
  const sortedUsers = useMemo(() => {
    const arr = [...active.users]
    if (sort === 'az') arr.sort((a, b) => (a.name ?? a.username ?? '').localeCompare(b.name ?? b.username ?? ''))
    if (sort === 'za') arr.sort((a, b) => (b.name ?? b.username ?? '').localeCompare(a.name ?? a.username ?? ''))
    if (sort === 'earliest') arr.reverse()
    return arr
  }, [active.users, sort])

  const sortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Default'

  const handleReport = async (reason: string) => {
    if (!reportTarget) return
    try {
      await ApiService.reportUser(reportTarget.id, reason)
      showPill('Report submitted', 'success')
    } catch {
      showPill('Report not sent, try again', 'error')
    }
  }

  const handleBlock = async () => {
    if (!blockTarget) return
    try {
      await ApiService.blockUser(blockTarget.id)
      showPill(`${blockTarget.name ?? 'User'} blocked`, 'success')
      followersList.removeFollower(blockTarget.id)
      followingList.removeFollower(blockTarget.id)
    } catch {
      showPill("Couldn't block this person", 'error')
    }
  }

  const handleDotsAction = (key: string) => {
    if (!dotsTarget) return
    if (key === 'report') { setReportTarget(dotsTarget); setDotsTarget(null) }
    if (key === 'block')  { setBlockTarget(dotsTarget);  setDotsTarget(null) }
  }

  const renderItem = ({ item }: { item: FollowUser }) => (
    <UserFollowCard
      user={item}
      type={activeTab}
      isMyProfile={active.isMyProfile}
      onFollow={active.toggleFollow}
      onUnfollow={() => setConfirmTarget({ user: item, action: 'unfollow' })}
      onRemove={() => setConfirmTarget({ user: item, action: 'remove' })}
      onDots={(u) => setDotsTarget(u)}
    />
  )

  const emptyText = active.query.trim()
    ? 'No results'
    : activeTab === 'followers'
      ? (active.isMyProfile ? 'No one is vibing you yet' : 'No vibers yet')
      : (active.isMyProfile ? "You're not vibing anyone yet" : 'Not vibing anyone yet')

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={goBack} style={s.backBtn} hitSlop={8} android_ripple={null}>
          <ChevronLeft size={24} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerName} numberOfLines={1}>{displayName || 'Profile'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Tab switcher ── */}
      <View style={s.tabs}>
        <Pressable style={[s.tab, activeTab === 'followers' && s.tabActive]} android_ripple={null} onPress={() => setActiveTab('followers')}>
          <Text style={[s.tabInline, activeTab === 'followers' && s.tabInlineActive]}>
            <Text style={[s.tabCount, activeTab === 'followers' && s.tabCountActive]}>{liveVibersCount} </Text>
            <Text style={[s.tabLabel, activeTab === 'followers' && s.tabLabelActive]}>Vibers</Text>
          </Text>
        </Pressable>
        <Pressable style={[s.tab, activeTab === 'following' && s.tabActive]} android_ripple={null} onPress={() => setActiveTab('following')}>
          <Text style={[s.tabInline, activeTab === 'following' && s.tabInlineActive]}>
            <Text style={[s.tabCount, activeTab === 'following' && s.tabCountActive]}>{liveVibingCount} </Text>
            <Text style={[s.tabLabel, activeTab === 'following' && s.tabLabelActive]}>Vibing</Text>
          </Text>
        </Pressable>
      </View>

      {/* ── Sort row + search ── */}
      <View style={s.toolbarWrap}>
        <Text style={s.sortLabelText}>Sorted by</Text>
        <Pressable style={s.toolbarAction} onPress={() => setSortSheetOpen(true)} android_ripple={null}>
          <Text style={s.sortBold}>{sortLabel}</Text>
          <ArrowUpDown size={16} color={Colors.inkSecondary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={s.searchWrap}>
        <Search size={15} color={Colors.inkSecondary} strokeWidth={1.5} />
        <TextInput
          style={s.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.inkSecondary}
          value={active.query}
          onChangeText={active.setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {active.query.length > 0 && (
          <Pressable onPress={() => active.setQuery('')} hitSlop={8} android_ripple={null}>
            <XIcon size={14} color={Colors.inkSecondary} />
          </Pressable>
        )}
      </View>

      {/* ── List ── */}
      {active.loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brandOrange} />
        </View>
      ) : active.error && sortedUsers.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Pressable onPress={() => active.load()} style={s.retryBtn} android_ripple={null}>
            <Text style={s.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          key={activeTab}
          data={sortedUsers}
          keyExtractor={u => u.id}
          renderItem={renderItem}
          ItemSeparatorComponent={null}
          onEndReached={active.loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl
              refreshing={active.refreshing}
              onRefresh={() => active.load(true)}
              tintColor={Colors.brandOrange}
            />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Users size={48} color={Colors.elevated} strokeWidth={1} />
              <Text style={s.emptyTitle}>{emptyText}</Text>
            </View>
          }
          ListFooterComponent={
            active.loadingMore
              ? <View style={s.loadingMore}><ActivityIndicator size="small" color={Colors.inkSecondary} /></View>
              : null
          }
        />
      )}

      {/* ── Sort bottom sheet (gorhom) ── */}
      <SortSheet
        visible={sortSheetOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        selected={sort}
        onSelect={(key) => setSort(key)}
        onClose={() => setSortSheetOpen(false)}
      />

      {/* ── Dots action sheet (gorhom) ── */}
      <DotsSheet
        visible={!!dotsTarget}
        title={dotsTarget?.name ?? dotsTarget?.username ?? 'User'}
        actions={DOTS_ACTIONS}
        onAction={handleDotsAction}
        onClose={() => setDotsTarget(null)}
      />

      <ReportSheet
        visible={!!reportTarget}
        targetName={reportTarget?.name ?? null}
        onSubmit={handleReport}
        onClose={() => setReportTarget(null)}
      />

      <BlockSheet
        visible={!!blockTarget}
        targetName={blockTarget?.name ?? null}
        isBlocked={false}
        onBlock={handleBlock}
        onUnblock={() => {}}
        onClose={() => setBlockTarget(null)}
      />

      <ConfirmSheet
        visible={!!confirmTarget}
        title={
          confirmTarget?.action === 'unfollow'
            ? `Unfollow ${confirmTarget.user.name ?? confirmTarget.user.username ?? 'this person'}?`
            : `Remove ${confirmTarget?.user.name ?? confirmTarget?.user.username ?? 'this person'}?`
        }
        body={
          confirmTarget?.action === 'unfollow'
            ? "Their posts won't appear in your feed anymore. You can follow them again anytime."
            : "They won't be notified that you removed them. They can still follow you again."
        }
        confirmLabel={confirmTarget?.action === 'unfollow' ? 'Unfollow' : 'Remove'}
        destructive
        onConfirm={() => {
          if (!confirmTarget) return
          if (confirmTarget.action === 'unfollow') active.toggleFollow(confirmTarget.user.id)
          else active.removeFollower(confirmTarget.user.id)
        }}
        onClose={() => setConfirmTarget(null)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold },
  headerName: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.inkPrimary },
  tabInline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  tabInlineActive: { color: Colors.inkPrimary },
  tabCount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
  },
  tabCountActive: {},
  tabLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
  },
  tabLabelActive: {},

  // Toolbar
  toolbarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortLabelText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  toolbarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  sortBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkPrimary,
    padding: 0,
  },

  // List
  sep: { height: 1, backgroundColor: Colors.divider, marginLeft: 76 },
  loadingMore: { paddingVertical: 20, alignItems: 'center' },

  // Empty / error
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 15,
    color: Colors.inkSecondary, textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.divider,
  },
  retryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})

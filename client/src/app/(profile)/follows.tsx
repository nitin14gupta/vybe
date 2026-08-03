import React, { useEffect, useMemo, useState } from 'react'
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
import { ArrowLeft, ArrowUpDown, Search, Users, X as XIcon } from 'lucide-react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily } from '@/constants'
import { ReportSheet, BlockSheet, SortSheet, DotsSheet, ConfirmSheet, SwipeableTabs } from '@/components/ui'
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
  const [followersEverActive, setFollowersEverActive] = useState(initTab === 'followers')
  const [followingEverActive, setFollowingEverActive] = useState(initTab === 'following')
  useEffect(() => {
    if (activeTab === 'followers') setFollowersEverActive(true)
    else setFollowingEverActive(true)
  }, [activeTab])

  const followersList = useFollowsList(userId, 'followers', followersEverActive)
  const followingList = useFollowsList(userId, 'following', followingEverActive)
  const active = activeTab === 'followers' ? followersList : followingList

  // Tab count: prefer live count from loaded data, fall back to param
  const liveVibersCount = followersList.loading ? parseInt(vibersCount ?? '0', 10) : followersList.totalCount
  const liveVibingCount = followingList.loading ? parseInt(vibingCount ?? '0', 10) : followingList.totalCount

  // Apply sort — computed per-list so both panes stay ready for the pager
  const applySort = (users: FollowUser[]) => {
    const arr = [...users]
    if (sort === 'az') arr.sort((a, b) => (a.name ?? a.username ?? '').localeCompare(b.name ?? b.username ?? ''))
    if (sort === 'za') arr.sort((a, b) => (b.name ?? b.username ?? '').localeCompare(a.name ?? a.username ?? ''))
    if (sort === 'earliest') arr.reverse()
    return arr
  }
  const sortedFollowers = useMemo(() => applySort(followersList.users), [followersList.users, sort])
  const sortedFollowing = useMemo(() => applySort(followingList.users), [followingList.users, sort])

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

  const emptyText = (type: 'followers' | 'following', list: ReturnType<typeof useFollowsList>) =>
    list.query.trim()
      ? 'No results'
      : type === 'followers'
        ? (list.isMyProfile ? 'No one is vibing you yet' : 'No vibers yet')
        : (list.isMyProfile ? "You're not vibing anyone yet" : 'Not vibing anyone yet')

  const renderPane = (type: 'followers' | 'following', list: ReturnType<typeof useFollowsList>, sorted: FollowUser[]) => (
    list.loading ? (
      <AutoSkeletonView isLoading animationType="gradient" defaultRadius={7} gradientColors={['#1e1e1e', '#2e2e2e']}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={s.skRow}>
            <View style={s.skAvatar} />
            <View style={s.skInfo}>
              <View style={s.skLineName} />
              <View style={s.skLineUser} />
            </View>
          </View>
        ))}
      </AutoSkeletonView>
    ) : list.error && sorted.length === 0 ? (
      <View style={s.center}>
        <Text style={s.emptyTitle}>Something went wrong</Text>
        <Pressable onPress={() => list.load()} style={s.retryBtn} android_ripple={null}>
          <Text style={s.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    ) : (
      <FlashList
        data={sorted}
        keyExtractor={u => u.id}
        renderItem={({ item }) => (
          <UserFollowCard
            user={item}
            type={type}
            isMyProfile={list.isMyProfile}
            onFollow={list.toggleFollow}
            onUnfollow={() => setConfirmTarget({ user: item, action: 'unfollow' })}
            onRemove={() => setConfirmTarget({ user: item, action: 'remove' })}
            onDots={(u) => setDotsTarget(u)}
          />
        )}
        ItemSeparatorComponent={null}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={() => list.load(true)}
            tintColor={Colors.brandOrange}
          />
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Users size={48} color={Colors.elevated} strokeWidth={1} />
            <Text style={s.emptyTitle}>{emptyText(type, list)}</Text>
          </View>
        }
        ListFooterComponent={
          list.loadingMore
            ? <View style={s.loadingMore}><ActivityIndicator size="small" color={Colors.inkSecondary} /></View>
            : null
        }
      />
    )
  )

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={goBack} style={s.backBtn} hitSlop={8} android_ripple={null}>
          <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerName} numberOfLines={1}>{displayName || 'Profile'}</Text>
        <View style={{ width: 36 }} />
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

      {/* ── Swipeable tabs + list ── */}
      <SwipeableTabs
        tabs={[
          { key: 'followers', label: 'Vibers', count: liveVibersCount },
          { key: 'following', label: 'Vibing', count: liveVibingCount },
        ]}
        activeTab={activeTab}
        onChange={t => setActiveTab(t as 'followers' | 'following')}
      >
        {[renderPane('followers', followersList, sortedFollowers), renderPane('following', followingList, sortedFollowing)]}
      </SwipeableTabs>

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

  // Loading skeleton
  skRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  skAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2a2a2a' },
  skInfo: { flex: 1, gap: 8 },
  skLineName: { height: 14, width: '55%', borderRadius: 7, backgroundColor: '#2a2a2a' },
  skLineUser: { height: 12, width: '35%', borderRadius: 6, backgroundColor: '#2a2a2a' },

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

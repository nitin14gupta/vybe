import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowUpDown, Search, Users, X as XIcon } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { ReportSheet, BlockSheet } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'
import { useFollowsList } from '@/hooks/useFollowsList'
import { UserFollowCard } from '@/components/profile/UserFollowCard'
import ApiService from '@/api/apiService'
import type { FollowUser } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

type SortKey = 'default' | 'az' | 'za' | 'earliest'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Default (Recent)' },
  { key: 'az',      label: 'Name A → Z' },
  { key: 'za',      label: 'Name Z → A' },
  { key: 'earliest',label: 'Earliest first' },
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
      showPill('Could not submit report', 'error')
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
      showPill('Could not block user', 'error')
    }
  }

  const renderItem = ({ item }: { item: FollowUser }) => (
    <UserFollowCard
      user={item}
      type={activeTab}
      isMyProfile={active.isMyProfile}
      onFollow={active.toggleFollow}
      onUnfollow={active.toggleFollow}
      onRemove={active.removeFollower}
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
        <Pressable onPress={goBack} style={s.backBtn} hitSlop={8}>
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <Text style={s.headerName} numberOfLines={1}>{displayName || 'Profile'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Tab switcher ── */}
      <View style={s.tabs}>
        <Pressable style={[s.tab, activeTab === 'followers' && s.tabActive]} onPress={() => setActiveTab('followers')}>
          <Text style={[s.tabCount, activeTab === 'followers' && s.tabCountActive]}>{liveVibersCount}</Text>
          <Text style={[s.tabLabel, activeTab === 'followers' && s.tabLabelActive]}>Vibers</Text>
        </Pressable>
        <Pressable style={[s.tab, activeTab === 'following' && s.tabActive]} onPress={() => setActiveTab('following')}>
          <Text style={[s.tabCount, activeTab === 'following' && s.tabCountActive]}>{liveVibingCount}</Text>
          <Text style={[s.tabLabel, activeTab === 'following' && s.tabLabelActive]}>Vibing</Text>
        </Pressable>
      </View>

      {/* ── Sort row + search ── */}
      <View style={s.toolbar}>
        <Pressable style={s.sortBtn} onPress={() => setSortSheetOpen(true)}>
          <Text style={s.sortText}>Sorted by <Text style={s.sortBold}>{sortLabel}</Text></Text>
          <ArrowUpDown size={14} color={Colors.inkSecondary} strokeWidth={1.5} />
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
          <Pressable onPress={() => active.setQuery('')} hitSlop={8}>
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
          <Pressable onPress={active.load} style={s.retryBtn}>
            <Text style={s.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          key={activeTab}
          data={sortedUsers}
          keyExtractor={u => u.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          estimatedItemSize={72}
          onEndReached={active.loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
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

      {/* ── Sort bottom sheet ── */}
      {sortSheetOpen && (
        <Pressable style={s.overlay} onPress={() => setSortSheetOpen(false)}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={[s.sheetRow, sort === opt.key && s.sheetRowActive]}
                onPress={() => { setSort(opt.key); setSortSheetOpen(false) }}
              >
                <Text style={[s.sheetRowText, sort === opt.key && s.sheetRowTextActive]}>{opt.label}</Text>
                {sort === opt.key && <View style={s.sheetRowDot} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}

      {/* Dots action sheet */}
      {dotsTarget && (
        <Pressable style={s.overlay} onPress={() => setDotsTarget(null)}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{dotsTarget.name ?? dotsTarget.username ?? 'User'}</Text>
            <Pressable style={s.sheetRow} onPress={() => { setReportTarget(dotsTarget); setDotsTarget(null) }}>
              <Text style={s.sheetRowText}>Report</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: Colors.divider }} />
            <Pressable style={s.sheetRow} onPress={() => { setBlockTarget(dotsTarget); setDotsTarget(null) }}>
              <Text style={[s.sheetRowText, { color: Colors.brandCoral }]}>Block</Text>
            </Pressable>
          </View>
        </Pressable>
      )}

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
    fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary,
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
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 1,
  },
  tabActive: { borderBottomColor: Colors.brandOrange },
  tabCount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkSecondary,
  },
  tabCountActive: { color: Colors.inkPrimary },
  tabLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  tabLabelActive: { color: Colors.inkSecondary },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  sortBold: {
    fontFamily: FontFamily.bodySemiBold,
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

  // Sort sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: Colors.inkSecondary,
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sheetRowActive: { backgroundColor: 'rgba(255,107,53,0.06)' },
  sheetRowText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  sheetRowTextActive: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.brandOrange,
  },
  sheetRowDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.brandOrange,
  },
})

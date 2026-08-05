import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants'
import { SwipeableTabs } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'
import { useFollowsList } from '@/hooks/useFollowsList'
import { FollowsHeader } from '@/components/profile/FollowsHeader'
import { FollowsPane } from '@/components/profile/FollowsPane'
import { FollowsSheets } from '@/components/profile/FollowsSheets'
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

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      <FollowsHeader
        displayName={displayName}
        onBack={goBack}
        sortLabel={sortLabel}
        onOpenSort={() => setSortSheetOpen(true)}
        query={active.query}
        onChangeQuery={active.setQuery}
      />

      {/* ── Swipeable tabs + list ── */}
      <SwipeableTabs
        tabs={[
          { key: 'followers', label: 'Vibers', count: liveVibersCount },
          { key: 'following', label: 'Vibing', count: liveVibingCount },
        ]}
        activeTab={activeTab}
        onChange={t => setActiveTab(t as 'followers' | 'following')}
      >
        {[
          <FollowsPane
            key="followers"
            type="followers"
            list={followersList}
            sorted={sortedFollowers}
            bottomInset={insets.bottom}
            onFollow={followersList.toggleFollow}
            onUnfollow={(user) => setConfirmTarget({ user, action: 'unfollow' })}
            onRemove={(user) => setConfirmTarget({ user, action: 'remove' })}
            onDots={setDotsTarget}
          />,
          <FollowsPane
            key="following"
            type="following"
            list={followingList}
            sorted={sortedFollowing}
            bottomInset={insets.bottom}
            onFollow={followingList.toggleFollow}
            onUnfollow={(user) => setConfirmTarget({ user, action: 'unfollow' })}
            onRemove={(user) => setConfirmTarget({ user, action: 'remove' })}
            onDots={setDotsTarget}
          />,
        ]}
      </SwipeableTabs>

      <FollowsSheets
        sortSheetOpen={sortSheetOpen}
        sortOptions={SORT_OPTIONS}
        sort={sort}
        onSelectSort={setSort}
        onCloseSortSheet={() => setSortSheetOpen(false)}

        dotsTarget={dotsTarget}
        onDotsAction={handleDotsAction}
        onCloseDotsSheet={() => setDotsTarget(null)}

        reportTarget={reportTarget}
        onSubmitReport={handleReport}
        onCloseReportSheet={() => setReportTarget(null)}

        blockTarget={blockTarget}
        onBlock={handleBlock}
        onCloseBlockSheet={() => setBlockTarget(null)}

        confirmTarget={confirmTarget}
        onConfirm={() => {
          if (!confirmTarget) return
          if (confirmTarget.action === 'unfollow') active.toggleFollow(confirmTarget.user.id)
          else active.removeFollower(confirmTarget.user.id)
        }}
        onCloseConfirmSheet={() => setConfirmTarget(null)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
})

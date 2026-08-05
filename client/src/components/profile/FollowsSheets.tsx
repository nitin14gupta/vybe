import React from 'react'
import { ReportSheet, BlockSheet, SortSheet, DotsSheet, ConfirmSheet } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import type { FollowUser } from '@/api/apiService'

type SortKey = 'default' | 'az' | 'za' | 'earliest'
type ConfirmTarget = { user: FollowUser; action: 'unfollow' | 'remove' } | null

const DOTS_ACTIONS = [
  { key: 'report', label: 'Report' },
  { key: 'block', label: 'Block', destructive: true },
]

interface Props {
  sortSheetOpen: boolean
  sortOptions: SortOption<SortKey>[]
  sort: SortKey
  onSelectSort: (key: SortKey) => void
  onCloseSortSheet: () => void

  dotsTarget: FollowUser | null
  onDotsAction: (key: string) => void
  onCloseDotsSheet: () => void

  reportTarget: FollowUser | null
  onSubmitReport: (reason: string) => Promise<void>
  onCloseReportSheet: () => void

  blockTarget: FollowUser | null
  onBlock: () => void
  onCloseBlockSheet: () => void

  confirmTarget: ConfirmTarget
  onConfirm: () => void
  onCloseConfirmSheet: () => void
}

export function FollowsSheets({
  sortSheetOpen, sortOptions, sort, onSelectSort, onCloseSortSheet,
  dotsTarget, onDotsAction, onCloseDotsSheet,
  reportTarget, onSubmitReport, onCloseReportSheet,
  blockTarget, onBlock, onCloseBlockSheet,
  confirmTarget, onConfirm, onCloseConfirmSheet,
}: Props) {
  return (
    <>
      <SortSheet
        visible={sortSheetOpen}
        title="Sort by"
        options={sortOptions}
        selected={sort}
        onSelect={onSelectSort}
        onClose={onCloseSortSheet}
      />

      <DotsSheet
        visible={!!dotsTarget}
        title={dotsTarget?.name ?? dotsTarget?.username ?? 'User'}
        actions={DOTS_ACTIONS}
        onAction={onDotsAction}
        onClose={onCloseDotsSheet}
      />

      <ReportSheet
        visible={!!reportTarget}
        targetName={reportTarget?.name ?? null}
        onSubmit={onSubmitReport}
        onClose={onCloseReportSheet}
      />

      <BlockSheet
        visible={!!blockTarget}
        targetName={blockTarget?.name ?? null}
        isBlocked={false}
        onBlock={onBlock}
        onUnblock={() => {}}
        onClose={onCloseBlockSheet}
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
        onConfirm={onConfirm}
        onClose={onCloseConfirmSheet}
      />
    </>
  )
}

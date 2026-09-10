import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './Card'
import { Skeleton } from './Skeleton'
import { Pagination } from './Pagination'
import { EmptyState } from './EmptyState'

interface ListShellProps {
  isLoading: boolean
  empty: boolean
  emptyIcon: LucideIcon
  emptyLabel: string
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  skeletonCount?: number
  /** Skeleton height in the loading state — taller for card grids, shorter for table rows. */
  skeletonHeight?: string
  /** Loading skeletons and children render in a grid instead of a stacked list (for card-grid pages like Events). */
  grid?: boolean
  /** Wrap non-empty children in a padded Card. Set false for card-grid pages that render their own cards. */
  card?: boolean
  children: React.ReactNode
}

/** Shared loading / empty / content+pagination shell for every list page. */
export function ListShell({
  isLoading,
  empty,
  emptyIcon,
  emptyLabel,
  total,
  page,
  pageSize,
  onPageChange,
  skeletonCount = 5,
  skeletonHeight = 'h-12',
  grid = false,
  card = true,
  children,
}: ListShellProps) {
  if (isLoading) {
    const skeletons = Array.from({ length: skeletonCount }).map((_, i) => (
      <Skeleton key={i} className={cn(skeletonHeight, 'w-full')} />
    ))
    return grid ? (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{skeletons}</div>
    ) : (
      <div className="flex flex-col gap-2">{skeletons}</div>
    )
  }

  if (empty) {
    return <EmptyState icon={emptyIcon} label={emptyLabel} />
  }

  const pagination = total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />

  if (!card) {
    return (
      <div className="flex flex-col gap-4">
        {children}
        {pagination}
      </div>
    )
  }

  return (
    <Card className="p-0">
      <div className="p-4">
        {children}
        {pagination}
      </div>
    </Card>
  )
}

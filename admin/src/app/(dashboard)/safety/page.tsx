'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/formatters'
import type { UserReportItem, EventReportItem, MessageReportItem, BlockItem } from '@/types/reports'
import type { AuditLogItem } from '@/types/audit'
import type { PaginatedResponse } from '@/types/feedback'

const PAGE_SIZE = 20

export default function SafetyPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Safety</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Reports and blocks across the platform, for moderation review.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Reports</TabsTrigger>
          <TabsTrigger value="events">Event Reports</TabsTrigger>
          <TabsTrigger value="messages">Message Reports</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="activity">Admin Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UserReportsTab /></TabsContent>
        <TabsContent value="events"><EventReportsTab /></TabsContent>
        <TabsContent value="messages"><MessageReportsTab /></TabsContent>
        <TabsContent value="blocks"><BlocksTab /></TabsContent>
        <TabsContent value="activity"><AdminActivityTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function usePaginatedReports<T>(key: string, path: string, page: number) {
  return useQuery({
    queryKey: [key, page],
    queryFn: () => apiClient.get<PaginatedResponse<T>>(`${path}?page=${page}&page_size=${PAGE_SIZE}`),
  })
}

function TableShell({
  isLoading,
  empty,
  emptyLabel,
  total,
  page,
  pageSize,
  onPageChange,
  children,
}: {
  isLoading: boolean
  empty: boolean
  emptyLabel: string
  total: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  children: React.ReactNode
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-12 text-zinc-400 dark:border-zinc-800">
        <ShieldAlert className="h-8 w-8" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <Card className="p-0">
      <div className="p-4">
        {children}
        {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />}
      </div>
    </Card>
  )
}

function UserReportsTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePaginatedReports<UserReportItem>('admin-reports-users', '/admin/reports/users', page)

  return (
    <TableShell
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No user reports"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? PAGE_SIZE}
      onPageChange={setPage}
    >
      <Table>
        <THead><TR><TH>Reported user</TH><TH>Reported by</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/users/${r.reported_id}`} className="hover:underline">
                  {r.reported_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{r.reported_phone}</span>
                </Link>
              </TD>
              <TD>
                <Link href={`/users/${r.reporter_id}`} className="hover:underline">
                  {r.reporter_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{r.reporter_phone}</span>
                </Link>
              </TD>
              <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
              <TD>{formatDate(r.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableShell>
  )
}

function EventReportsTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePaginatedReports<EventReportItem>('admin-reports-events', '/admin/reports/events', page)

  return (
    <TableShell
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No event reports"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? PAGE_SIZE}
      onPageChange={setPage}
    >
      <Table>
        <THead><TR><TH>Event</TH><TH>Reported by</TH><TH>Reason</TH><TH>Description</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/events/${r.event_id}`} className="hover:underline">
                  {r.event_title}
                </Link>
                {r.event_is_cancelled && <Badge variant="danger" className="ml-2">Cancelled</Badge>}
              </TD>
              <TD>
                <Link href={`/users/${r.reporter_id}`} className="hover:underline">
                  {r.reporter_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{r.reporter_phone}</span>
                </Link>
              </TD>
              <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
              <TD>{r.description ?? '—'}</TD>
              <TD>{formatDate(r.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableShell>
  )
}

function MessageReportsTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePaginatedReports<MessageReportItem>('admin-reports-messages', '/admin/reports/messages', page)

  return (
    <TableShell
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No message reports"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? PAGE_SIZE}
      onPageChange={setPage}
    >
      <Table>
        <THead><TR><TH>Sender</TH><TH>Message</TH><TH>Reported by</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/users/${r.sender_id}`} className="hover:underline">{r.sender_name ?? 'Unnamed'}</Link>
              </TD>
              <TD className="max-w-xs truncate">
                {r.message_content_type === 'text' ? (r.message_content ?? '—') : (
                  <Badge variant="neutral" className="capitalize">{r.message_content_type}</Badge>
                )}
              </TD>
              <TD>
                <Link href={`/users/${r.reporter_id}`} className="hover:underline">
                  {r.reporter_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{r.reporter_phone}</span>
                </Link>
              </TD>
              <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
              <TD>{formatDate(r.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableShell>
  )
}

const ACTION_LABELS: Record<string, string> = {
  lock_user: 'Locked user',
  unlock_user: 'Unlocked user',
  force_cancel_event: 'Force-cancelled event',
  update_support_status: 'Updated ticket status',
}

function targetHref(targetType: string, targetId: string | null): string | null {
  if (!targetId) return null
  if (targetType === 'user') return `/users/${targetId}`
  if (targetType === 'event') return `/events/${targetId}`
  return null
}

function AdminActivityTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePaginatedReports<AuditLogItem>('admin-audit-log', '/admin/audit-log', page)

  return (
    <TableShell
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No admin activity yet"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? PAGE_SIZE}
      onPageChange={setPage}
    >
      <Table>
        <THead><TR><TH>Admin</TH><TH>Action</TH><TH>Detail</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((a) => {
            const href = targetHref(a.target_type, a.target_id)
            return (
              <TR key={a.id}>
                <TD>{a.admin_name ?? a.admin_email}</TD>
                <TD>
                  {href ? (
                    <Link href={href} className="hover:underline">{ACTION_LABELS[a.action] ?? a.action}</Link>
                  ) : (
                    ACTION_LABELS[a.action] ?? a.action
                  )}
                </TD>
                <TD>{a.detail ?? '—'}</TD>
                <TD>{formatDate(a.created_at)}</TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
    </TableShell>
  )
}

function BlocksTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePaginatedReports<BlockItem>('admin-reports-blocks', '/admin/reports/blocks', page)

  return (
    <TableShell
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No blocks"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? PAGE_SIZE}
      onPageChange={setPage}
    >
      <Table>
        <THead><TR><TH>Blocked by</TH><TH>Blocked user</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((b) => (
            <TR key={b.id}>
              <TD>
                <Link href={`/users/${b.blocker_id}`} className="hover:underline">
                  {b.blocker_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{b.blocker_phone}</span>
                </Link>
              </TD>
              <TD>
                <Link href={`/users/${b.blocked_id}`} className="hover:underline">
                  {b.blocked_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{b.blocked_phone}</span>
                </Link>
              </TD>
              <TD>{formatDate(b.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableShell>
  )
}

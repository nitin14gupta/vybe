'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Search } from 'lucide-react'
import {
  useUserReportsQuery, useEventReportsQuery, useMessageReportsQuery, useBlocksQuery, useAdminActivityQuery,
} from '@/hooks/useReports'
import { usePagination } from '@/hooks/usePagination'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/formatters'
import { ACTION_LABELS, targetHref } from '@/lib/auditLog'

export default function SafetyPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Safety' }]}
        title="Safety"
        subtitle="Reports and blocks across the platform, for moderation review."
      />

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

function UserReportsTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useUserReportsQuery(page, pageSize)

  return (
    <ListShell
      emptyIcon={ShieldAlert}
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No user reports"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    >
      <Table>
        <THead><TR><TH>Reported user</TH><TH>Reported by</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/users/${r.reported_id}`} className="hover:underline">
                  {r.reported_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{r.reported_phone}</span>
                </Link>
              </TD>
              <TD>
                <Link href={`/users/${r.reporter_id}`} className="hover:underline">
                  {r.reporter_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{r.reporter_phone}</span>
                </Link>
              </TD>
              <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
              <TD>{formatDate(r.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  )
}

function EventReportsTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useEventReportsQuery(page, pageSize)

  return (
    <ListShell
      emptyIcon={ShieldAlert}
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No event reports"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
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
                  {r.reporter_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{r.reporter_phone}</span>
                </Link>
              </TD>
              <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
              <TD>{r.description ?? '—'}</TD>
              <TD>{formatDate(r.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  )
}

function MessageReportsTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useMessageReportsQuery(page, pageSize)

  return (
    <ListShell
      emptyIcon={ShieldAlert}
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No message reports"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
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
                  {r.reporter_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{r.reporter_phone}</span>
                </Link>
              </TD>
              <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
              <TD>{formatDate(r.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  )
}

function AdminActivityTab() {
  const [q, setQ] = useState('')
  const [action, setAction] = useState('')
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useAdminActivityQuery(page, pageSize, { q, action })

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by admin name or email"
            className="w-64 pl-9"
          />
        </div>
        <Select value={action || 'all'} onValueChange={(v) => { setAction(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Toolbar>

      <ListShell
        emptyIcon={ShieldAlert}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No admin activity matches this filter"
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
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
      </ListShell>
    </div>
  )
}

function BlocksTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useBlocksQuery(page, pageSize)

  return (
    <ListShell
      emptyIcon={ShieldAlert}
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No blocks"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    >
      <Table>
        <THead><TR><TH>Blocked by</TH><TH>Blocked user</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((b) => (
            <TR key={b.id}>
              <TD>
                <Link href={`/users/${b.blocker_id}`} className="hover:underline">
                  {b.blocker_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{b.blocker_phone}</span>
                </Link>
              </TD>
              <TD>
                <Link href={`/users/${b.blocked_id}`} className="hover:underline">
                  {b.blocked_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{b.blocked_phone}</span>
                </Link>
              </TD>
              <TD>{formatDate(b.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  )
}

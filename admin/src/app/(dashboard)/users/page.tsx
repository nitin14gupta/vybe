'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Lock, ChevronRight, Users as UsersIcon } from 'lucide-react'
import { useUsersQuery } from '@/hooks/useUsers'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { HostBadge } from '@/components/ui/HostBadge'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { formatDate, formatRelative } from '@/lib/formatters'

const PAGE_SIZE = 25
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deleted' },
] as const

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useUsersQuery({ q, status, page, pageSize: PAGE_SIZE })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Users' }]}
        title="Users"
        subtitle={data ? `${data.total.toLocaleString()} total` : 'Loading…'}
      />

      <Toolbar>
        <div className="flex gap-2">
          {STATUS_TABS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              active={status === t.value}
              onClick={() => { setStatus(t.value); setPage(1) }}
            />
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, username or phone"
            className="w-64 pl-9"
          />
        </div>
      </Toolbar>

      <ListShell
        emptyIcon={UsersIcon}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No users match this filter"
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? PAGE_SIZE}
        onPageChange={setPage}
        skeletonCount={6}
      >
        <Table>
          <THead>
            <TR>
              <TH>User</TH>
              <TH>Phone</TH>
              <TH>City</TH>
              <TH>Wallet</TH>
              <TH>Status</TH>
              <TH>Joined</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {data?.items.map((u) => (
              <TR key={u.id}>
                <TD>
                  <Link href={`/users/${u.id}`} className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size={32} />
                    <div>
                      <p className="flex items-center gap-1.5 font-medium text-ink-primary">
                        {u.name ?? 'Unnamed'}
                        <HostBadge tier={u.host_badges[0]} size={16} />
                      </p>
                      {u.username && (
                        <p className="text-xs text-ink-secondary">@{u.username}</p>
                      )}
                    </div>
                  </Link>
                </TD>
                <TD>{u.country_code}{u.phone}</TD>
                <TD>{u.city ?? '—'}</TD>
                <TD>₹{u.wallet_balance.toLocaleString()}</TD>
                <TD>
                  {u.is_deleted ? (
                    <div>
                      <Badge variant="neutral">Deleted</Badge>
                      {u.purge_at && (
                        <p className="mt-1 text-xs text-ink-secondary">Purges {formatRelative(u.purge_at)}</p>
                      )}
                    </div>
                  ) : u.is_locked ? (
                    <Badge variant="danger">
                      <Lock className="h-3 w-3" /> Locked
                    </Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TD>
                <TD>{formatDate(u.created_at)}</TD>
                <TD>
                  <Link href={`/users/${u.id}`}>
                    <ChevronRight className="h-4 w-4 text-ink-secondary" />
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ListShell>
    </div>
  )
}

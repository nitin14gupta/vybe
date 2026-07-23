'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, Lock, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatRelative } from '@/lib/formatters'
import type { UserListResponse } from '@/types/user'

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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      return apiClient.get<UserListResponse>(`/admin/users?${params}`)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Users</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data ? `${data.total.toLocaleString()} total` : 'Loading…'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatus(t.value); setPage(1) }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === t.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, username or phone"
            className="w-64 rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="p-4">
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
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {u.name ?? 'Unnamed'}
                          </p>
                          {u.username && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">@{u.username}</p>
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
                            <p className="mt-1 text-xs text-zinc-400">Purges {formatRelative(u.purge_at)}</p>
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
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            {data && (
              <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

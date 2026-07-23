'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatInr } from '@/lib/formatters'
import type { WalletTransactionItem, WalletStats } from '@/types/wallet'
import type { PaginatedResponse } from '@/types/feedback'

const PAGE_SIZE = 25
const TYPES = ['credit', 'debit', 'refund_requested'] as const
const SOURCES = ['event_refund', 'ticket_purchase', 'bank_refund_request'] as const

export default function WalletPage() {
  const [type, setType] = useState('')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data: stats } = useQuery({
    queryKey: ['admin-wallet-stats'],
    queryFn: () => apiClient.get<WalletStats>('/admin/wallet/stats'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallet-transactions', type, source, q, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
      if (type) params.set('type', type)
      if (source) params.set('source', source)
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<WalletTransactionItem>>(`/admin/wallet/transactions?${params}`)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Wallet</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Gorave Wallet balances and transactions across all users.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total wallet liability" value={stats ? formatInr(stats.total_liability) : '—'} icon={Wallet} />
        <StatCard
          label={`Total credited${stats ? ` (${stats.credit_count})` : ''}`}
          value={stats ? formatInr(stats.total_credits) : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label={`Total debited${stats ? ` (${stats.debit_count})` : ''}`}
          value={stats ? formatInr(stats.total_debits) : '—'}
          icon={TrendingDown}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by user name or phone"
            className="w-64 rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="p-4">
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH>Type</TH>
                  <TH>Source</TH>
                  <TH>Amount</TH>
                  <TH>Description</TH>
                  <TH>Date</TH>
                </TR>
              </THead>
              <TBody>
                {data?.items.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <Link href={`/users/${t.user_id}`} className="hover:underline">
                        {t.user_name ?? 'Unnamed'}
                        <span className="block text-xs text-zinc-400">{t.user_phone}</span>
                      </Link>
                    </TD>
                    <TD>
                      <Badge variant={t.type === 'debit' ? 'danger' : t.type === 'credit' ? 'success' : 'warning'}>
                        {t.type.replace(/_/g, ' ')}
                      </Badge>
                    </TD>
                    <TD className="capitalize">{t.source.replace(/_/g, ' ')}</TD>
                    <TD className={t.type === 'debit' ? 'text-red-600' : 'text-emerald-600'}>
                      {t.type === 'debit' ? '-' : '+'}{formatInr(t.amount_inr)}
                    </TD>
                    <TD>{t.description ?? '—'}</TD>
                    <TD>{formatDate(t.created_at)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {data && <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />}
          </div>
        )}
      </Card>
    </div>
  )
}

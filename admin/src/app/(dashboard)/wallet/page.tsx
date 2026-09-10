'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { useWalletStatsQuery, useWalletTransactionsQuery } from '@/hooks/useWallet'
import { StatCard } from '@/components/ui/StatCard'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { formatDate, formatInr } from '@/lib/formatters'

const PAGE_SIZE = 25
const TYPES = ['credit', 'debit', 'refund_requested'] as const
const SOURCES = ['event_refund', 'ticket_purchase', 'bank_refund_request'] as const

export default function WalletPage() {
  const [type, setType] = useState('')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data: stats } = useWalletStatsQuery()
  const { data, isLoading } = useWalletTransactionsQuery({ type, source, q, page, pageSize: PAGE_SIZE })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Wallet' }]}
        title="Wallet"
        subtitle="Gorave Wallet balances and transactions across all users."
      />

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

      <Toolbar>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by user name or phone"
            className="w-64 pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={type || 'all'} onValueChange={(v) => { setType(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={source || 'all'} onValueChange={(v) => { setSource(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      <ListShell
        emptyIcon={Receipt}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No transactions match this filter"
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
                    <span className="block text-xs text-ink-secondary">{t.user_phone}</span>
                  </Link>
                </TD>
                <TD>
                  <Badge variant={t.type === 'debit' ? 'danger' : t.type === 'credit' ? 'success' : 'warning'}>
                    {t.type.replace(/_/g, ' ')}
                  </Badge>
                </TD>
                <TD className="capitalize">{t.source.replace(/_/g, ' ')}</TD>
                <TD className={t.type === 'debit' ? 'text-destructive' : 'text-offer-green'}>
                  {t.type === 'debit' ? '-' : '+'}{formatInr(t.amount_inr)}
                </TD>
                <TD>{t.description ?? '—'}</TD>
                <TD>{formatDate(t.created_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ListShell>
    </div>
  )
}

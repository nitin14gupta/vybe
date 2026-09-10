'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Wallet, TrendingUp, TrendingDown, Receipt, Download } from 'lucide-react'
import { useWalletStatsQuery, useWalletTransactionsQuery, fetchAllWalletTransactions } from '@/hooks/useWallet'
import { usePagination } from '@/hooks/usePagination'
import { StatCard } from '@/components/ui/StatCard'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { formatDate, formatInr } from '@/lib/formatters'
import { toCsv, downloadCsv } from '@/lib/csv'
import { useToast } from '@/hooks/useToast'

const TYPES = ['credit', 'debit', 'refund_requested'] as const
const SOURCES = ['event_refund', 'ticket_purchase', 'bank_refund_request'] as const

export default function WalletPage() {
  const [type, setType] = useState('')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')
  const { page, pageSize, setPage, setPageSize } = usePagination()
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  const { data: stats } = useWalletStatsQuery()
  const { data, isLoading } = useWalletTransactionsQuery({ type, source, q, page, pageSize })

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = await fetchAllWalletTransactions({ type, source, q })
      const csv = toCsv(rows, [
        { header: 'User', get: (t) => t.user_name ?? 'Unnamed' },
        { header: 'Phone', get: (t) => t.user_phone },
        { header: 'Type', get: (t) => t.type },
        { header: 'Source', get: (t) => t.source },
        { header: 'Amount', get: (t) => t.amount_inr },
        { header: 'Description', get: (t) => t.description ?? '' },
        { header: 'Date', get: (t) => formatDate(t.created_at) },
      ])
      downloadCsv('gorave-wallet-transactions.csv', csv)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to export transactions')
    } finally {
      setExporting(false)
    }
  }

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
          <Button variant="outline" onClick={handleExport} loading={exporting}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </Toolbar>

      <ListShell
        emptyIcon={Receipt}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No transactions match this filter"
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Search, TrendingUp, Wallet, Landmark, Trophy, Users as UsersIcon, Star, Banknote, Download } from 'lucide-react'
import {
  useRevenueStatsQuery, useRevenueByDayQuery, useRevenueHostsQuery, useRevenueLeaderboardQuery, fetchAllRevenueHosts,
} from '@/hooks/useRevenue'
import { usePagination } from '@/hooks/usePagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { ListShell } from '@/components/ui/ListShell'
import { chartColors } from '@/lib/chartColors'
import { formatInr } from '@/lib/formatters'
import { toCsv, downloadCsv } from '@/lib/csv'
import { useToast } from '@/hooks/useToast'

function formatDayTick(day: string) {
  return new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function RevenuePage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Revenue' }]}
        title="Revenue"
        subtitle="What Gorave actually earns, what hosts are owed, and who's driving it."
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payouts">Host Payouts</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="payouts"><PayoutsTab /></TabsContent>
        <TabsContent value="leaderboard"><LeaderboardTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const c = chartColors()
  const { data: stats } = useRevenueStatsQuery()
  const { data: byDay, isLoading } = useRevenueByDayQuery()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue (all time)" value={stats ? formatInr(stats.total_revenue) : '—'} icon={TrendingUp} />
        <StatCard label="Platform fee earned" value={stats ? formatInr(stats.total_platform_fee) : '—'} icon={Wallet} />
        <StatCard label="Host commission earned" value={stats ? formatInr(stats.total_host_commission) : '—'} icon={Landmark} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={byDay} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.gridline} />
                <XAxis
                  dataKey="day" tickFormatter={formatDayTick} interval={4}
                  tick={{ fill: c.muted, fontSize: 12 }} axisLine={{ stroke: c.baseline }} tickLine={false}
                />
                <YAxis
                  tick={{ fill: c.muted, fontSize: 12 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{ background: c.surface, border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-satoshi)' }}
                  labelFormatter={(label) => formatDayTick(String(label))}
                  labelStyle={{ color: c.textSecondary }}
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: c.textSecondary }} />
                <Line type="monotone" dataKey="platform_fee" name="Platform fee" stroke={c.series1} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="host_commission" name="Host commission" stroke={c.series2} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PayoutsTab() {
  const [q, setQ] = useState('')
  const { page, pageSize, setPage, setPageSize } = usePagination()
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  const { data, isLoading } = useRevenueHostsQuery({ q, page, pageSize })

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = await fetchAllRevenueHosts({ q })
      const csv = toCsv(rows, [
        { header: 'Host', get: (h) => h.host_name ?? 'Unnamed' },
        { header: 'Phone', get: (h) => h.host_phone },
        { header: 'Paid Events', get: (h) => h.paid_events_count },
        { header: 'Gross Revenue', get: (h) => h.gross_ticket_revenue },
        { header: 'Commission', get: (h) => h.commission_taken },
        { header: 'Net Payable', get: (h) => h.net_payable },
        { header: 'Payout Method', get: (h) => (h.has_payout_details ? h.payout_method ?? 'on file' : 'missing') },
      ])
      downloadCsv('gorave-host-payouts.csv', csv)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to export payouts')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink-secondary">
        Net payable = gross ticket revenue minus Gorave&apos;s commission, across non-cancelled paid events. No automated payout system exists yet — use this to settle hosts manually.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by host name or phone"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleExport} loading={exporting}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <ListShell
        emptyIcon={Banknote}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No hosts match this search"
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <Table>
          <THead>
            <TR>
              <TH>Host</TH>
              <TH>Paid events</TH>
              <TH>Gross revenue</TH>
              <TH>Commission</TH>
              <TH>Net payable</TH>
              <TH>Payout details</TH>
            </TR>
          </THead>
          <TBody>
            {data?.items.map((h) => (
              <TR key={h.host_id}>
                <TD>
                  <Link href={`/users/${h.host_id}`} className="hover:underline">
                    {h.host_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{h.host_phone}</span>
                  </Link>
                </TD>
                <TD>{h.paid_events_count}</TD>
                <TD>{formatInr(h.gross_ticket_revenue)}</TD>
                <TD className="text-destructive">-{formatInr(h.commission_taken)}</TD>
                <TD className="font-semibold text-offer-green">{formatInr(h.net_payable)}</TD>
                <TD>
                  {h.has_payout_details ? (
                    <Badge variant="success" className="capitalize">{h.payout_method ?? 'on file'}</Badge>
                  ) : (
                    <Badge variant="warning">Missing</Badge>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ListShell>
    </div>
  )
}

function LeaderboardTab() {
  const { data, isLoading } = useRevenueLeaderboardQuery()

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Top hosts by revenue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Host</TH><TH>Events</TH><TH>Gross revenue</TH><TH>Net payable</TH></TR></THead>
            <TBody>
              {data.top_hosts.map((h, i) => (
                <TR key={h.host_id}>
                  <TD>
                    <span className="mr-2 text-ink-secondary">#{i + 1}</span>
                    <Link href={`/users/${h.host_id}`} className="hover:underline">{h.host_name ?? 'Unnamed'}</Link>
                  </TD>
                  <TD>{h.paid_events_count}</TD>
                  <TD>{formatInr(h.gross_ticket_revenue)}</TD>
                  <TD className="font-semibold text-offer-green">{formatInr(h.net_payable)}</TD>
                </TR>
              ))}
              {data.top_hosts.length === 0 && (
                <TR><TD colSpan={4} className="text-center text-ink-secondary">No paid ticket sales yet</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Top events by attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Event</TH><TH>Host</TH><TH>Attendees</TH></TR></THead>
            <TBody>
              {data.top_events_by_attendance.map((e) => (
                <TR key={e.id}>
                  <TD><Link href={`/events/${e.id}`} className="hover:underline">{e.title}</Link></TD>
                  <TD>{e.host_name ?? 'Unknown'}</TD>
                  <TD>{e.attendee_count}/{e.capacity}</TD>
                </TR>
              ))}
              {data.top_events_by_attendance.length === 0 && (
                <TR><TD colSpan={3} className="text-center text-ink-secondary">No attendees yet</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="h-4 w-4" /> Top events by rating</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Event</TH><TH>Host</TH><TH>Rating</TH></TR></THead>
            <TBody>
              {data.top_events_by_rating.map((e) => (
                <TR key={e.id}>
                  <TD><Link href={`/events/${e.id}`} className="hover:underline">{e.title}</Link></TD>
                  <TD>{e.host_name ?? 'Unknown'}</TD>
                  <TD>{e.avg_rating} ★ <span className="text-xs text-ink-secondary">({e.review_count})</span></TD>
                </TR>
              ))}
              {data.top_events_by_rating.length === 0 && (
                <TR><TD colSpan={3} className="text-center text-ink-secondary">No reviews yet</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

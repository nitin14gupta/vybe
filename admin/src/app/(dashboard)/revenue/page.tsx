'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Search, TrendingUp, Wallet, Landmark, Trophy, Users as UsersIcon, Star } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { chartColors } from '@/lib/chartColors'
import { formatInr } from '@/lib/formatters'
import type { RevenueStats, RevenueByDay, HostPayoutItem, LeaderboardResponse } from '@/types/revenue'
import type { PaginatedResponse } from '@/types/feedback'

const PAGE_SIZE = 20

function formatDayTick(day: string) {
  return new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function RevenuePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Revenue</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          What Gorave actually earns, what hosts are owed, and who&apos;s driving it.
        </p>
      </div>

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
  const isDark = useMediaQuery('(prefers-color-scheme: dark)')
  const c = chartColors(isDark)

  const { data: stats } = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: () => apiClient.get<RevenueStats>('/admin/revenue/stats'),
  })
  const { data: byDay, isLoading } = useQuery({
    queryKey: ['admin-revenue-by-day'],
    queryFn: () => apiClient.get<RevenueByDay[]>('/admin/revenue/by-day'),
  })

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
                  contentStyle={{ background: c.surface, border: `1px solid ${c.gridline}`, borderRadius: 8, fontSize: 13 }}
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
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue-hosts', q, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<HostPayoutItem>>(`/admin/revenue/hosts?${params}`)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-zinc-400">
        Net payable = gross ticket revenue minus Gorave&apos;s commission, across non-cancelled paid events. No automated payout system exists yet — use this to settle hosts manually.
      </p>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Search by host name or phone"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="p-4">
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
                        {h.host_name ?? 'Unnamed'}<span className="block text-xs text-zinc-400">{h.host_phone}</span>
                      </Link>
                    </TD>
                    <TD>{h.paid_events_count}</TD>
                    <TD>{formatInr(h.gross_ticket_revenue)}</TD>
                    <TD className="text-red-600">-{formatInr(h.commission_taken)}</TD>
                    <TD className="font-semibold text-emerald-600">{formatInr(h.net_payable)}</TD>
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
            {data && data.total > 0 && (
              <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function LeaderboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue-leaderboard'],
    queryFn: () => apiClient.get<LeaderboardResponse>('/admin/revenue/leaderboard'),
  })

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
                    <span className="mr-2 text-zinc-400">#{i + 1}</span>
                    <Link href={`/users/${h.host_id}`} className="hover:underline">{h.host_name ?? 'Unnamed'}</Link>
                  </TD>
                  <TD>{h.paid_events_count}</TD>
                  <TD>{formatInr(h.gross_ticket_revenue)}</TD>
                  <TD className="font-semibold text-emerald-600">{formatInr(h.net_payable)}</TD>
                </TR>
              ))}
              {data.top_hosts.length === 0 && (
                <TR><TD colSpan={4} className="text-center text-zinc-400">No paid ticket sales yet</TD></TR>
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
                <TR><TD colSpan={3} className="text-center text-zinc-400">No attendees yet</TD></TR>
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
                  <TD>{e.avg_rating} ★ <span className="text-xs text-zinc-400">({e.review_count})</span></TD>
                </TR>
              ))}
              {data.top_events_by_rating.length === 0 && (
                <TR><TD colSpan={3} className="text-center text-zinc-400">No reviews yet</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

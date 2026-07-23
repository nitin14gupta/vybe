'use client'

import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LabelList,
} from 'recharts'
import { Users, CalendarDays, CalendarClock, CalendarCheck, Wallet, MessageSquare, Lock, Ban } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient } from '@/lib/apiClient'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { chartColors, STATUS_COLOR } from '@/lib/chartColors'
import { formatInr } from '@/lib/formatters'
import type { DashboardResponse } from '@/types/dashboard'

function formatDayTick(day: string) {
  const d = new Date(day)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const { admin } = useAdminAuth()
  const isDark = useMediaQuery('(prefers-color-scheme: dark)')
  const c = chartColors(isDark)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get<DashboardResponse>('/admin/dashboard'),
  })

  const stats = data?.stats

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome{admin?.name ? `, ${admin.name}` : ''}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s a snapshot of what&apos;s happening on Gorave.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats ? stats.total_users.toLocaleString() : '—'} icon={Users} />
        <StatCard label="Locked accounts" value={stats ? stats.locked_users.toLocaleString() : '—'} icon={Lock} />
        <StatCard label="Active now" value={stats ? stats.active_events.toLocaleString() : '—'} icon={CalendarDays} />
        <StatCard label="Upcoming events" value={stats ? stats.upcoming_events.toLocaleString() : '—'} icon={CalendarClock} />
        <StatCard label="Past events" value={stats ? stats.past_events.toLocaleString() : '—'} icon={CalendarCheck} />
        <StatCard label="Cancelled events" value={stats ? stats.cancelled_events.toLocaleString() : '—'} icon={Ban} />
        <StatCard label="Wallet liability" value={stats ? formatInr(stats.wallet_liability) : '—'} icon={Wallet} />
        <StatCard label="Open tickets" value={stats ? stats.open_tickets.toLocaleString() : '—'} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New signups — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.signups_by_day} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={c.gridline} />
                  <XAxis
                    dataKey="day" tickFormatter={formatDayTick} interval={4}
                    tick={{ fill: c.muted, fontSize: 12 }} axisLine={{ stroke: c.baseline }} tickLine={false}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: c.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.gridline}`, borderRadius: 8, fontSize: 13 }}
                    labelFormatter={(label) => formatDayTick(String(label))}
                    labelStyle={{ color: c.textSecondary }}
                  />
                  <Line
                    type="monotone" dataKey="count" name="Signups"
                    stroke={c.series1} strokeWidth={2} dot={false}
                    activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events by type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data?.events_by_type} layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke={c.gridline} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: c.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="event_type" width={100}
                    tick={{ fill: c.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.replace(/_/g, ' ')}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.gridline}`, borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: c.textSecondary }}
                    formatter={(value) => [value, 'Events']}
                  />
                  <Bar dataKey="count" fill={c.series1} radius={[0, 4, 4, 0]} maxBarSize={22}>
                    <LabelList dataKey="count" position="right" fill={c.textSecondary} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet flow — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.wallet_flow_by_day} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
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
                  <Line type="monotone" dataKey="credits" name="Credits" stroke={c.series1} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="debits" name="Debits" stroke={c.series2} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support tickets by status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data?.support_by_status} layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke={c.gridline} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: c.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="status" width={100}
                    tick={{ fill: c.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v[0].toUpperCase() + v.slice(1)}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.gridline}`, borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: c.textSecondary }}
                    formatter={(value) => [value, 'Tickets']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {data?.support_by_status.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? c.muted} />
                    ))}
                    <LabelList dataKey="count" position="right" fill={c.textSecondary} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LabelList,
} from 'recharts'
import {
  Users, CalendarDays, CalendarClock, CalendarCheck, Wallet, MessageSquare, Lock, Ban, Activity, ArrowRight,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useDashboardQuery } from '@/hooks/useDashboard'
import { useAdminActivityQuery } from '@/hooks/useReports'
import { chartColors, STATUS_COLOR } from '@/lib/chartColors'
import { formatInr, formatRelative } from '@/lib/formatters'
import { ACTION_LABELS, targetHref } from '@/lib/auditLog'

function formatDayTick(day: string) {
  const d = new Date(day)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const { admin } = useAdminAuth()
  const c = chartColors()
  const { data, isLoading } = useDashboardQuery()
  const { data: activity, isLoading: activityLoading } = useAdminActivityQuery(1)

  const stats = data?.stats
  const recentActivity = activity?.items.slice(0, 6) ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard' }]}
        title={`Welcome${admin?.name ? `, ${admin.name}` : ''}`}
        subtitle="Here's a snapshot of what's happening on Gorave."
      />

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
                    contentStyle={{ background: c.surface, border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-satoshi)' }}
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
                    cursor={{ fill: 'rgba(255,107,53,0.12)' }}
                    contentStyle={{ background: c.surface, border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-satoshi)' }}
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
                    contentStyle={{ background: c.surface, border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-satoshi)' }}
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
                    cursor={{ fill: 'rgba(255,107,53,0.12)' }}
                    contentStyle={{ background: c.surface, border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-satoshi)' }}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent activity
          </CardTitle>
          <Link href="/safety" className="flex items-center gap-1 text-xs font-semibold text-ink-secondary hover:text-ink-primary">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-ink-secondary">No admin activity yet</p>
          ) : (
            <div className="flex flex-col divide-y divide-divider">
              {recentActivity.map((a) => {
                const href = targetHref(a.target_type, a.target_id)
                const label = ACTION_LABELS[a.action] ?? a.action
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <span className="text-ink-primary">{a.admin_name ?? a.admin_email}</span>
                      <span className="text-ink-secondary"> — </span>
                      {href ? (
                        <Link href={href} className="text-ink-primary hover:underline">{label}</Link>
                      ) : (
                        <span className="text-ink-primary">{label}</span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-ink-secondary">{formatRelative(a.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

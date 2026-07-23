'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Inbox } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/formatters'
import { useToast } from '@/hooks/useToast'
import type { AppFeedbackItem, SupportRequestItem, PaginatedResponse } from '@/types/feedback'

const PAGE_SIZE = 20
const STATUSES = ['open', 'resolved', 'closed'] as const

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Feedback</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          App feedback and support tickets from users.
        </p>
      </div>

      <Tabs defaultValue="support">
        <TabsList>
          <TabsTrigger value="support">Support Requests</TabsTrigger>
          <TabsTrigger value="app-feedback">App Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="support">
          <SupportRequestsTab />
        </TabsContent>
        <TabsContent value="app-feedback">
          <AppFeedbackTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function statusBadgeVariant(status: string) {
  if (status === 'open') return 'warning' as const
  if (status === 'resolved') return 'success' as const
  return 'neutral' as const
}

function SupportRequestsTab() {
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support', status, page],
    queryFn: () =>
      apiClient.get<PaginatedResponse<SupportRequestItem>>(
        `/admin/feedback/support?page=${page}&page_size=${PAGE_SIZE}${status ? `&status=${status}` : ''}`,
      ),
  })

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/feedback/support/${id}`, { status: newStatus })
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-support'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <FilterChip label="All" active={status === ''} onClick={() => { setStatus(''); setPage(1) }} />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={s[0].toUpperCase() + s.slice(1)}
            active={status === s}
            onClick={() => { setStatus(s); setPage(1) }}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState icon={Inbox} label="No support requests" />
      ) : (
        <div className="flex flex-col gap-3">
          {data?.items.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.topic}</span>
                    <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{r.message}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    <Link href={`/users/${r.user_id}`} className="hover:underline">
                      {r.user_name ?? 'Unnamed'} · {r.user_phone}
                    </Link>
                    {' · '}{formatDate(r.created_at)}
                  </p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                  className="h-9 shrink-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
      )}
    </div>
  )
}

function AppFeedbackTab() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-app-feedback', page],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AppFeedbackItem>>(
        `/admin/feedback/app-feedback?page=${page}&page_size=${PAGE_SIZE}`,
      ),
  })

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState icon={MessageSquare} label="No feedback yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {data?.items.map((f) => (
            <Card key={f.id}>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{f.text}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  <Link href={`/users/${f.user_id}`} className="hover:underline">
                    {f.user_name ?? 'Unnamed'} · {f.user_phone}
                  </Link>
                  {' · '}{formatDate(f.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-orange-600 text-white'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  )
}

function EmptyState({ icon: Icon, label }: { icon: typeof Inbox; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-12 text-zinc-400 dark:border-zinc-800">
      <Icon className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

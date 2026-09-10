'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Inbox } from 'lucide-react'
import { useSupportRequestsQuery, useUpdateSupportStatusMutation, useAppFeedbackQuery } from '@/hooks/useFeedback'
import { usePagination } from '@/hooks/usePagination'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { ListShell } from '@/components/ui/ListShell'
import { formatDate } from '@/lib/formatters'
import { useToast } from '@/hooks/useToast'

const STATUSES = ['open', 'resolved', 'closed'] as const

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Feedback' }]}
        title="Feedback"
        subtitle="App feedback and support tickets from users."
      />

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
  const { page, pageSize, setPage, setPageSize } = usePagination()
  const toast = useToast()

  const { data, isLoading } = useSupportRequestsQuery({ status, page, pageSize })
  const updateStatusMutation = useUpdateSupportStatusMutation()

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus })
      toast.success('Status updated')
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

      <ListShell
        emptyIcon={Inbox}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No support requests"
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        skeletonCount={4}
        skeletonHeight="h-24"
        card={false}
      >
        <div className="flex flex-col gap-3">
          {data?.items.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-ink-primary">{r.topic}</span>
                    <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-ink-secondary">{r.message}</p>
                  <p className="mt-2 text-xs text-ink-secondary">
                    <Link href={`/users/${r.user_id}`} className="hover:underline">
                      {r.user_name ?? 'Unnamed'} · {r.user_phone}
                    </Link>
                    {' · '}{formatDate(r.created_at)}
                  </p>
                </div>
                <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      </ListShell>
    </div>
  )
}

function AppFeedbackTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination()
  const { data, isLoading } = useAppFeedbackQuery({ page, pageSize })

  return (
    <ListShell
      emptyIcon={MessageSquare}
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No feedback yet"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      skeletonCount={4}
      skeletonHeight="h-20"
      card={false}
    >
      <div className="flex flex-col gap-3">
        {data?.items.map((f) => (
          <Card key={f.id}>
            <CardContent>
              <p className="text-sm text-ink-secondary">{f.text}</p>
              <p className="mt-2 text-xs text-ink-secondary">
                <Link href={`/users/${f.user_id}`} className="hover:underline">
                  {f.user_name ?? 'Unnamed'} · {f.user_phone}
                </Link>
                {' · '}{formatDate(f.created_at)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ListShell>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Users, MapPin, ImageOff } from 'lucide-react'
import { useEventsQuery } from '@/hooks/useEvents'
import { usePagination } from '@/hooks/usePagination'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { formatDate, formatInr } from '@/lib/formatters'

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export default function EventsPage() {
  const [status, setStatus] = useState<string>('active')
  const [q, setQ] = useState('')
  const { page, pageSize, setPage, setPageSize } = usePagination(12)

  const { data, isLoading } = useEventsQuery({ status, q, page, pageSize })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Events' }]}
        title="Events"
        subtitle={data ? `${data.total.toLocaleString()} ${status} events` : 'Loading…'}
      />

      <Toolbar>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              active={status === t.value}
              onClick={() => { setStatus(t.value); setPage(1) }}
            />
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by title or host"
            className="w-64 pl-9"
          />
        </div>
      </Toolbar>

      <ListShell
        emptyIcon={ImageOff}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={`No ${status} events`}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        skeletonCount={6}
        skeletonHeight="h-64"
        grid
        card={false}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:glow-shadow-brand">
                <div className="relative aspect-video w-full bg-surface-muted">
                  {e.cover_photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.cover_photos[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-secondary">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  {e.is_cancelled && (
                    <span className="absolute left-2 top-2">
                      <Badge variant="danger">Cancelled</Badge>
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="line-clamp-1 font-semibold text-ink-primary">{e.title}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
                    <MapPin className="h-3.5 w-3.5" /> {formatDate(e.date_time)}
                  </p>
                  <p className="text-xs text-ink-secondary">Hosted by {e.host_name ?? 'Unknown'}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-xs text-ink-secondary">
                      <Users className="h-3.5 w-3.5" /> {e.attendee_count}/{e.capacity}
                    </span>
                    <span className="text-sm font-semibold text-ink-primary">
                      {e.is_free ? 'Free' : formatInr(e.price_inr + e.platform_fee_inr)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </ListShell>
    </div>
  )
}

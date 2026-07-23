'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, MapPin, ImageOff } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, formatInr } from '@/lib/formatters'
import type { EventListItem } from '@/types/event'
import type { PaginatedResponse } from '@/types/feedback'

const PAGE_SIZE = 12
const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export default function EventsPage() {
  const [status, setStatus] = useState<string>('active')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', status, q, page],
    queryFn: () => {
      const params = new URLSearchParams({ status, page: String(page), page_size: String(PAGE_SIZE) })
      if (q) params.set('q', q)
      return apiClient.get<PaginatedResponse<EventListItem>>(`/admin/events?${params}`)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Events</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data ? `${data.total.toLocaleString()} ${status} events` : 'Loading…'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatus(t.value); setPage(1) }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === t.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by title or host"
            className="w-64 rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-16 text-zinc-400 dark:border-zinc-800">
          <ImageOff className="h-8 w-8" />
          <p className="text-sm">No {status} events</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
                  {e.cover_photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.cover_photos[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
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
                  <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <MapPin className="h-3.5 w-3.5" /> {formatDate(e.date_time)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Hosted by {e.host_name ?? 'Unknown'}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Users className="h-3.5 w-3.5" /> {e.attendee_count}/{e.capacity}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {e.is_free ? 'Free' : formatInr(e.price_inr + e.platform_fee_inr)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
      )}
    </div>
  )
}

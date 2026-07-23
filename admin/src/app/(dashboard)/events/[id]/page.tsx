'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, MapPin, Calendar, Users, Ban, Star, ShieldAlert, Clock,
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { ImageSlider } from '@/components/ui/ImageSlider'
import { ImageModal } from '@/components/ui/ImageModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, formatInr } from '@/lib/formatters'
import { useToast } from '@/hooks/useToast'
import type { EventDetailResponse } from '@/types/event'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => apiClient.get<EventDetailResponse>(`/admin/events/${id}`),
    enabled: !!id,
  })

  const handleCancel = async () => {
    try {
      await apiClient.post(`/admin/events/${id}/cancel`)
      toast.success('Event cancelled and attendees refunded')
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel event')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { event } = data
  const attendeeTotal = event.price_inr + event.platform_fee_inr

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => router.push('/events')}
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ImageSlider photos={event.cover_photos} aspect="16:9" onImageClick={() => setGalleryOpen(true)} />
        </div>
        <ImageModal
          photos={event.cover_photos}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />

        <Card className="lg:col-span-2">
          <CardContent className="flex h-full flex-col justify-between gap-4">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{event.title}</h1>
                {event.is_cancelled ? (
                  <Badge variant="danger">Cancelled</Badge>
                ) : (() => {
                  const now = new Date()
                  const start = new Date(event.date_time)
                  const end = event.end_time ? new Date(event.end_time) : start
                  if (now < start) return <Badge variant="success">Upcoming</Badge>
                  if (now > end) return <Badge variant="neutral">Past</Badge>
                  return <Badge variant="warning">Active now</Badge>
                })()}
                <Badge variant="neutral" className="capitalize">{event.event_type}</Badge>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <Calendar className="h-4 w-4" /> {formatDate(event.date_time)}
                {event.end_time && ` → ${formatDate(event.end_time)}`}
              </p>
              {event.location_name && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <MapPin className="h-4 w-4" /> {event.location_name}
                </p>
              )}
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Hosted by{' '}
                <Link href={`/users/${event.host_id}`} className="font-medium text-orange-600 hover:underline">
                  {event.host_name ?? 'Unknown'}
                </Link>
                {' · '}{event.host_phone}
              </p>
              {event.description && (
                <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{event.description}</p>
              )}
            </div>

            {!event.is_cancelled && (
              <div>
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" /> Force-cancel event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Attendees" value={`${data.attendees.length}/${event.capacity}`} icon={Users} />
        <MiniStat label="Waitlist" value={String(data.waitlist.length)} icon={Clock} />
        <MiniStat label="Avg rating" value={event.avg_rating ? `${event.avg_rating} ★` : '—'} icon={Star} />
        <MiniStat label="Reports" value={String(data.reports.length)} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Field label="Ticket price" value={event.is_free ? 'Free' : formatInr(event.price_inr)} />
          <Field label="Platform fee (attendee pays)" value={event.is_free ? '—' : formatInr(event.platform_fee_inr)} />
          <Field label="Attendee pays total" value={event.is_free ? 'Free' : formatInr(attendeeTotal)} />
          <Field label="Host commission (10%)" value={event.is_free ? '—' : formatInr(event.host_commission_inr)} />
          <Field label="Host receives" value={event.is_free ? '—' : formatInr(event.price_inr - event.host_commission_inr)} />
          <Field label="Platform profit / ticket" value={event.is_free ? '—' : formatInr(event.platform_profit_inr)} />
        </CardContent>
      </Card>

      <Tabs defaultValue="attendees">
        <TabsList>
          <TabsTrigger value="attendees">Attendees ({data.attendees.length})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({data.waitlist.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({data.reviews.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({data.reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="attendees">
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead><TR><TH>Name</TH><TH>Phone</TH><TH>Joined</TH><TH>Checked in</TH></TR></THead>
                <TBody>
                  {data.attendees.map((a) => (
                    <TR key={a.id}>
                      <TD><Link href={`/users/${a.user_id}`} className="hover:underline">{a.name ?? 'Unnamed'}</Link></TD>
                      <TD>{a.phone}</TD>
                      <TD>{formatDate(a.joined_at)}</TD>
                      <TD>{a.checked_in_at ? formatDate(a.checked_in_at) : '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waitlist">
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead><TR><TH>Name</TH><TH>Phone</TH><TH>Joined queue</TH><TH>Offer expires</TH></TR></THead>
                <TBody>
                  {data.waitlist.map((w) => (
                    <TR key={w.id}>
                      <TD><Link href={`/users/${w.user_id}`} className="hover:underline">{w.name ?? 'Unnamed'}</Link></TD>
                      <TD>{w.phone}</TD>
                      <TD>{formatDate(w.joined_at)}</TD>
                      <TD>{w.offer_expires_at ? formatDate(w.offer_expires_at) : '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="flex flex-col gap-3">
            {data.reviews.length === 0 && <p className="text-sm text-zinc-400">No reviews yet</p>}
            {data.reviews.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <div className="mb-1 flex items-center justify-between">
                    <Link href={`/users/${r.user_id}`} className="font-medium hover:underline">{r.name ?? 'Unnamed'}</Link>
                    <Badge variant="warning">{r.rating} ★</Badge>
                  </div>
                  {r.body && <p className="text-sm text-zinc-600 dark:text-zinc-300">{r.body}</p>}
                  <p className="mt-1 text-xs text-zinc-400">{formatDate(r.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead><TR><TH>Reported by</TH><TH>Reason</TH><TH>Description</TH><TH>Date</TH></TR></THead>
                <TBody>
                  {data.reports.map((r) => (
                    <TR key={r.id}>
                      <TD><Link href={`/users/${r.user_id}`} className="hover:underline">{r.name ?? 'Unnamed'}</Link></TD>
                      <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
                      <TD>{r.description ?? '—'}</TD>
                      <TD>{formatDate(r.created_at)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Force-cancel this event?"
        description="All confirmed attendees will be notified and paid attendees refunded to their Gorave Wallet. This cannot be undone."
        confirmLabel="Cancel event"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  )
}

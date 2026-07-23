'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lock, Unlock, Mic, ShieldAlert, Wallet, CalendarDays, MessageSquare, Heart } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageModal } from '@/components/ui/ImageModal'
import { formatDate, formatInr, formatRelative } from '@/lib/formatters'
import { useToast } from '@/hooks/useToast'
import type { UserDetail } from '@/types/user'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => apiClient.get<UserDetail>(`/admin/users/${id}`),
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const handleLock = async (reason?: string) => {
    try {
      await apiClient.patch(`/admin/users/${id}/lock`, { reason })
      toast.success('User locked')
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to lock user')
    }
  }

  const handleUnlock = async () => {
    try {
      await apiClient.patch(`/admin/users/${id}/unlock`)
      toast.success('User unlocked')
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unlock user')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { user } = data

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => router.push('/users')}
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar src={data.photos[0]?.url} name={user.name} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.name ?? 'Unnamed'}
                </h1>
                {user.is_locked ? (
                  <Badge variant="danger">Locked</Badge>
                ) : user.is_deleted ? (
                  <Badge variant="neutral">Deleted</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {user.username ? `@${user.username} · ` : ''}
                {user.country_code}{user.phone} · {user.city ?? 'No city set'}
              </p>
              {user.is_locked && user.locked_reason && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Locked {formatDate(user.locked_at)} — {user.locked_reason}
                </p>
              )}
              {user.is_deleted && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Requested deletion {formatDate(user.deleted_at)}
                  {user.purge_at && <> — permanently erased {formatRelative(user.purge_at)} (on {formatDate(user.purge_at)})</>}
                </p>
              )}
            </div>
          </div>

          {user.is_locked ? (
            <Button variant="outline" onClick={() => setUnlockDialogOpen(true)}>
              <Unlock className="h-4 w-4" /> Unlock account
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setLockDialogOpen(true)}>
              <Lock className="h-4 w-4" /> Lock account
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="support">Support & Feedback</TabsTrigger>
          <TabsTrigger value="vibes">Vibe Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab data={data} />
        </TabsContent>
        <TabsContent value="events">
          <EventsTab data={data} />
        </TabsContent>
        <TabsContent value="wallet">
          <WalletTab data={data} />
        </TabsContent>
        <TabsContent value="safety">
          <SafetyTab data={data} />
        </TabsContent>
        <TabsContent value="support">
          <SupportTab data={data} />
        </TabsContent>
        <TabsContent value="vibes">
          <VibesTab data={data} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        title="Lock this account?"
        description="The user will be logged out immediately and notified of the reason."
        confirmLabel="Lock account"
        variant="destructive"
        requireReason
        reasonLabel="Reason (shown to the user)"
        onConfirm={(reason) => handleLock(reason)}
      />
      <ConfirmDialog
        open={unlockDialogOpen}
        onOpenChange={setUnlockDialogOpen}
        title="Unlock this account?"
        description="The user will be able to log in again."
        confirmLabel="Unlock account"
        onConfirm={() => handleUnlock()}
      />
    </div>
  )
}

function ProfileTab({ data }: { data: UserDetail }) {
  const { user, photos } = data
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const photoSlides = photos.map((p) => ({ url: p.url, position: p.position }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="DOB" value={user.dob ? formatDate(user.dob) : '—'} />
          <Field label="Gender" value={user.gender ?? '—'} />
          <Field label="Bio" value={user.bio ?? '—'} full />
          <Field label="Interests" value={user.interests.join(', ') || '—'} full />
          <Field label="Badges" value={user.badges.join(', ') || '—'} full />
          <Field label="Profile complete" value={user.profile_complete ? 'Yes' : 'No'} />
          <Field label="Host onboarding" value={user.is_host_onboarding_finished ? 'Finished' : 'Not finished'} />
          <Field label="Joined" value={formatDate(user.created_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-4 w-4" /> Voice intro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.voice_url ? (
            <audio controls src={user.voice_url} className="w-full" />
          ) : (
            <p className="text-sm text-zinc-400">No voice intro recorded</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-zinc-400">No photos uploaded</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {photos.map((p, i) => (
                <button key={p.id} onClick={() => setModalIndex(i)} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover transition-opacity hover:opacity-80"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ImageModal
        photos={photoSlides}
        initialIndex={modalIndex ?? 0}
        open={modalIndex !== null}
        onOpenChange={(open) => !open && setModalIndex(null)}
      />
    </div>
  )
}

function EventsTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Hosted ({data.hosted_events.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR><TH>Title</TH><TH>Date</TH><TH>Price</TH><TH>Status</TH></TR>
            </THead>
            <TBody>
              {data.hosted_events.map((e) => (
                <TR key={e.id}>
                  <TD>{e.title}</TD>
                  <TD>{formatDate(e.date_time)}</TD>
                  <TD>{e.price_inr === 0 ? 'Free' : formatInr(e.price_inr)}</TD>
                  <TD>{e.is_cancelled ? <Badge variant="danger">Cancelled</Badge> : <Badge variant="success">Live</Badge>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Joined ({data.joined_events.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR><TH>Title</TH><TH>Date</TH><TH>Status</TH></TR>
            </THead>
            <TBody>
              {data.joined_events.map((e) => (
                <TR key={e.id}>
                  <TD>{e.title}</TD>
                  <TD>{formatDate(e.date_time)}</TD>
                  <TD className="capitalize">{e.status}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function WalletTab({ data }: { data: UserDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Balance: {formatInr(data.user.wallet_balance)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <THead>
            <TR><TH>Type</TH><TH>Source</TH><TH>Amount</TH><TH>Description</TH><TH>Date</TH></TR>
          </THead>
          <TBody>
            {data.wallet_transactions.map((t) => (
              <TR key={t.id}>
                <TD className="capitalize">{t.type}</TD>
                <TD className="capitalize">{t.source.replace(/_/g, ' ')}</TD>
                <TD className={t.type === 'debit' ? 'text-red-600' : 'text-emerald-600'}>
                  {t.type === 'debit' ? '-' : '+'}{formatInr(t.amount_inr)}
                </TD>
                <TD>{t.description ?? '—'}</TD>
                <TD>{formatDate(t.created_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SafetyTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Reports received ({data.reports_received.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Reported by</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.reports_received.map((r) => (
                <TR key={r.id}><TD>{r.reporter_name}</TD><TD>{r.reason}</TD><TD>{formatDate(r.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports filed ({data.reports_filed.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Against</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.reports_filed.map((r) => (
                <TR key={r.id}><TD>{r.reported_name}</TD><TD>{r.reason}</TD><TD>{formatDate(r.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked by this user ({data.blocked_by_user.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>User</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.blocked_by_user.map((b) => (
                <TR key={b.id}><TD>{b.name}</TD><TD>{formatDate(b.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked this user ({data.blocked_the_user.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>User</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.blocked_the_user.map((b) => (
                <TR key={b.id}><TD>{b.name}</TD><TD>{formatDate(b.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SupportTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Support requests ({data.support_requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.support_requests.length === 0 && <p className="text-sm text-zinc-400">None</p>}
          {data.support_requests.map((s) => (
            <div key={s.id} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{s.topic}</span>
                <Badge variant={s.status === 'open' ? 'warning' : 'neutral'}>{s.status}</Badge>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">{s.message}</p>
              <p className="mt-1 text-xs text-zinc-400">{formatDate(s.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App feedback ({data.app_feedback.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.app_feedback.length === 0 && <p className="text-sm text-zinc-400">None</p>}
          {data.app_feedback.map((f) => (
            <div key={f.id} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400">{f.text}</p>
              <p className="mt-1 text-xs text-zinc-400">{formatDate(f.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function VibesTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Sent ({data.vibe_requests_sent.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>To</TH><TH>Status</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.vibe_requests_sent.map((v) => (
                <TR key={v.id}><TD>{v.name}</TD><TD className="capitalize">{v.status}</TD><TD>{formatDate(v.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Received ({data.vibe_requests_received.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>From</TH><TH>Status</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.vibe_requests_received.map((v) => (
                <TR key={v.id}><TD>{v.name}</TD><TD className="capitalize">{v.status}</TD><TD>{formatDate(v.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  )
}

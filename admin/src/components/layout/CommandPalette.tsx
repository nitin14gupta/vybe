'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, Users, CalendarDays, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useCommandPaletteStore } from '@/store/commandPaletteStore'
import type { UserListResponse, UserListItem } from '@/types/user'
import type { EventListItem } from '@/types/event'
import type { PaginatedResponse } from '@/types/feedback'

const RESULT_LIMIT = 5

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserListItem[]>([])
  const [events, setEvents] = useState<EventListItem[]>([])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setOpen])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => inputRef.current?.focus(), 10)
    return () => clearTimeout(id)
  }, [open])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
      setUsers([])
      setEvents([])
    }
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (!value.trim()) {
      setUsers([])
      setEvents([])
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!query.trim()) return
    const handle = setTimeout(async () => {
      setLoading(true)
      try {
        const [userRes, eventRes] = await Promise.all([
          apiClient.get<UserListResponse>(`/admin/users?q=${encodeURIComponent(query)}&page_size=${RESULT_LIMIT}`),
          apiClient.get<PaginatedResponse<EventListItem>>(`/admin/events?q=${encodeURIComponent(query)}&page_size=${RESULT_LIMIT}`),
        ])
        setUsers(userRes.items)
        setEvents(eventRes.items)
      } catch {
        setUsers([])
        setEvents([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const hasResults = users.length > 0 || events.length > 0

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-glass-overlay backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-[18%] z-50 w-full max-w-lg -translate-x-1/2 rounded-modal border border-divider bg-surface glow-shadow"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">Jump to a user or event</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-divider px-5 py-4">
            <Search className="h-4 w-4 text-ink-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Jump to a user or event…"
              className="flex-1 bg-transparent font-sans text-sm text-ink-primary outline-none placeholder:text-ink-secondary"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-secondary" />}
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {!query.trim() ? (
              <p className="px-3 py-6 text-center text-sm text-ink-secondary">Start typing a name, phone, or event title…</p>
            ) : !loading && !hasResults ? (
              <p className="px-3 py-6 text-center text-sm text-ink-secondary">No matches for &quot;{query}&quot;</p>
            ) : (
              <>
                {users.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-ink-secondary">Users</p>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => go(`/users/${u.id}`)}
                        className="flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-left hover:bg-surface-muted"
                      >
                        <Users className="h-4 w-4 shrink-0 text-ink-secondary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-primary">{u.name ?? 'Unnamed'}</p>
                          <p className="truncate text-xs text-ink-secondary">{u.country_code}{u.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {events.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-ink-secondary">Events</p>
                    {events.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => go(`/events/${e.id}`)}
                        className="flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-left hover:bg-surface-muted"
                      >
                        <CalendarDays className="h-4 w-4 shrink-0 text-ink-secondary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-primary">{e.title}</p>
                          <p className="truncate text-xs text-ink-secondary">Hosted by {e.host_name ?? 'Unknown'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

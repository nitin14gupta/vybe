'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Menu, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSidebarStore } from '@/store/sidebarStore'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function Header() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  const { admin, logout } = useAdminAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-divider bg-background px-4 md:px-6">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-full p-2 text-ink-secondary hover:bg-surface md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden md:block" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded-full px-2 py-1.5 font-sans text-sm font-semibold text-ink-primary hover:bg-surface">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink-primary">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">{admin?.name ?? admin?.email ?? 'Admin'}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[160px] rounded-input border border-divider bg-elevated p-1 glow-shadow"
          >
            <DropdownMenu.Item
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-sans text-sm font-semibold text-destructive outline-none hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  )
}

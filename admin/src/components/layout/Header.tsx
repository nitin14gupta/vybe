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
    <header className="bg-paper flex h-16 shrink-0 items-center justify-between border-b-2 border-zinc-900 px-4 md:px-6">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-full p-2 text-zinc-600 hover:bg-zinc-900/5 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden md:block" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="font-sketch flex items-center gap-2 rounded-full px-2 py-1.5 text-base font-bold text-zinc-700 hover:bg-zinc-900/5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-amber-200 text-zinc-900">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">{admin?.name ?? admin?.email ?? 'Admin'}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[160px] rounded-xl border-2 border-zinc-900 bg-white p-1 shadow-[4px_4px_0px_0px_#18181b]"
          >
            <DropdownMenu.Item
              onClick={handleLogout}
              className="font-sketch flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-700 outline-none hover:bg-red-100"
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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'font-sketch flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-base font-bold transition-all',
              active
                ? 'border-zinc-900 bg-amber-300 text-zinc-900 shadow-[3px_3px_0px_0px_#18181b]'
                : 'border-transparent text-zinc-600 hover:border-zinc-900 hover:bg-white',
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed)
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed)
  const mobileOpen = useSidebarStore((s) => s.mobileOpen)
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'bg-paper hidden shrink-0 flex-col border-r-2 border-zinc-900 py-4 transition-all duration-200 md:flex',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div className={cn('mb-4 flex items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Gorave" className="h-8 w-8 shrink-0 brightness-0" />
          {!collapsed && (
            <span className="font-sketch text-xl font-bold text-zinc-900 underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-4">
              Gorave Admin
            </span>
          )}
        </div>
        <NavLinks collapsed={collapsed} />
        <div className="px-3 pt-2">
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-zinc-500 hover:bg-zinc-900/5"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="bg-paper absolute left-0 top-0 flex h-full w-64 flex-col border-r-2 border-zinc-900 py-4">
            <div className="mb-4 flex items-center justify-between px-4">
              <span className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.png" alt="Gorave" className="h-7 w-7 shrink-0 brightness-0" />
                <span className="font-sketch text-xl font-bold text-zinc-900 underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-4">
                  Gorave Admin
                </span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-1.5 hover:bg-zinc-900/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}

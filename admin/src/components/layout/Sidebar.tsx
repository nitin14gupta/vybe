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
              'flex items-center gap-3 rounded-input px-3 py-2.5 font-sans text-sm font-semibold transition-all',
              active
                ? 'bg-brand-gradient text-ink-on-accent glow-shadow-brand'
                : 'text-ink-secondary hover:bg-surface hover:text-ink-primary',
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
          'hidden shrink-0 flex-col border-r border-divider bg-background transition-all duration-200 md:flex',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Gorave" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="font-display text-xl font-bold text-ink-primary">Gorave Admin</span>
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavLinks collapsed={collapsed} />
          <div className="px-3 pt-2">
            <button
              onClick={toggleCollapsed}
              className="flex w-full items-center justify-center gap-2 rounded-input py-2 text-ink-secondary hover:bg-surface"
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-glass-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-divider bg-background">
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <span className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.png" alt="Gorave" className="h-7 w-7 shrink-0" />
                <span className="font-display text-xl font-bold text-ink-primary">Gorave Admin</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-1.5 text-ink-secondary hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto py-4">
              <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

import {
  LayoutDashboard, Users, CalendarDays, Wallet, TrendingUp, MessageSquare, ShieldAlert,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { href: '/users', label: 'Users', icon: Users, group: 'Community' },
  { href: '/safety', label: 'Safety', icon: ShieldAlert, group: 'Community' },
  { href: '/events', label: 'Events', icon: CalendarDays, group: 'Events' },
  { href: '/wallet', label: 'Wallet', icon: Wallet, group: 'Money' },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp, group: 'Money' },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare, group: 'Support' },
] as const

export const NAV_GROUPS = ['Overview', 'Community', 'Events', 'Money', 'Support'] as const

import {
  LayoutDashboard, Users, CalendarDays, Wallet, MessageSquare, ShieldAlert,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/safety', label: 'Safety', icon: ShieldAlert },
] as const

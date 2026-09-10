import type { ReactNode } from 'react'
import { BreadcrumbTrail, type BreadcrumbTrailItem } from './Breadcrumb'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  breadcrumb?: BreadcrumbTrailItem[]
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-1.5">
          <BreadcrumbTrail items={breadcrumb} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">{title}</h1>
          {subtitle && <p className="mt-1 font-sans text-sm text-ink-secondary">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

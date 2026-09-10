import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Breadcrumb({ className, ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" className={className} {...props} />
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-1.5 font-sans text-xs text-ink-secondary', className)}
      {...props}
    />
  )
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('flex items-center gap-1.5', className)} {...props} />
}

export function BreadcrumbLink({ className, href, ...props }: React.ComponentProps<typeof Link>) {
  return <Link href={href} className={cn('hover:text-ink-primary', className)} {...props} />
}

export function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return <span aria-current="page" className={cn('text-ink-primary', className)} {...props} />
}

export function BreadcrumbSeparator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span role="presentation" aria-hidden className={cn('flex items-center', className)} {...props}>
      <ChevronRight className="h-3.5 w-3.5" />
    </span>
  )
}

export interface BreadcrumbTrailItem {
  label: string
  href?: string
}

/** Convenience renderer for the common case: an array of {label, href?} with the last item as the current page. */
export function BreadcrumbTrail({ items }: { items: BreadcrumbTrailItem[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <BreadcrumbItem key={`${item.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div>
      <h1 className="font-sketch text-2xl font-bold text-zinc-900 underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-4">
        {title}
      </h1>
      {subtitle && <p className="font-sketch mt-1 text-base text-zinc-500">{subtitle}</p>}
    </div>
  )
}

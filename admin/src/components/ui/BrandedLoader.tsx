export function BrandedLoader({ size = 32 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full"
      style={{
        width: size,
        height: size,
        background: 'conic-gradient(from 0deg, var(--color-brand-orange), var(--color-brand-coral), transparent)',
        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
      }}
    />
  )
}

import { cn } from '@/lib/utils'

/** Normalizes a confidence value that may be provided as 0-1 or 0-100. */
export function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0
  const pct = value <= 1 ? value * 100 : value
  return Math.round(Math.max(0, Math.min(100, pct)))
}

export function confidenceLevel(pct: number): {
  label: 'High' | 'Medium' | 'Low'
  tone: 'success' | 'warning' | 'destructive'
} {
  if (pct >= 80) return { label: 'High', tone: 'success' }
  if (pct >= 60) return { label: 'Medium', tone: 'warning' }
  return { label: 'Low', tone: 'destructive' }
}

const toneClasses: Record<string, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
}

const dotClasses: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

export function ConfidenceBadge({
  value,
  showLabel = true,
  className,
}: {
  value: number
  showLabel?: boolean
  className?: string
}) {
  const pct = normalizeConfidence(value)
  const { label, tone } = confidenceLevel(pct)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotClasses[tone])} />
      <span className="font-mono tabular-nums">{pct}%</span>
      {showLabel ? <span className="opacity-90">{label}</span> : null}
    </span>
  )
}

/** A horizontal confidence bar with the numeric value always shown. */
export function ConfidenceBar({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const pct = normalizeConfidence(value)
  const { label, tone } = confidenceLevel(pct)
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-accent">
        <div
          className={cn('h-full rounded-full', dotClasses[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-foreground">
        {pct}%
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'destructive' && 'text-destructive',
        )}
      >
        {label}
      </span>
    </div>
  )
}

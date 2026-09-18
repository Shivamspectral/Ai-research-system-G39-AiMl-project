import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export function StatCard({
  label,
  value,
  hint,
  mono,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  mono?: boolean
  className?: string
}) {
  return (
    <Card className={cn('p-4', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-xl font-semibold text-foreground',
          mono && 'font-mono tabular-nums',
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  )
}

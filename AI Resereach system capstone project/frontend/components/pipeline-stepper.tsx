import { Check } from 'lucide-react'
import { PIPELINE_STEPS, STEP_LABELS, type PipelineStep } from '@/lib/api'
import { cn } from '@/lib/utils'

export type StepStatus = 'done' | 'current' | 'pending'

export function PipelineStepper({
  statuses,
  className,
}: {
  statuses: Record<PipelineStep, StepStatus>
  className?: string
}) {
  return (
    <ol className={cn('relative flex flex-col', className)}>
      {PIPELINE_STEPS.map((step, i) => {
        const status = statuses[step]
        const isLast = i === PIPELINE_STEPS.length - 1
        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  'absolute left-3 top-6 h-[calc(100%-1.5rem)] w-px -translate-x-1/2',
                  status === 'done' ? 'bg-success/40' : 'bg-border',
                )}
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                status === 'done' &&
                  'border-success bg-success text-success-foreground',
                status === 'current' &&
                  'border-primary bg-primary text-primary-foreground',
                status === 'pending' &&
                  'border-border bg-background text-subtle-foreground',
              )}
            >
              {status === 'done' ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : status === 'current' ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                </span>
              ) : (
                i + 1
              )}
            </span>
            <div className="flex min-h-6 flex-col justify-center">
              <span
                className={cn(
                  'text-sm font-medium',
                  status === 'pending'
                    ? 'text-muted-foreground'
                    : 'text-foreground',
                )}
              >
                {STEP_LABELS[step]}
              </span>
              {status === 'current' ? (
                <span className="font-mono text-[11px] text-primary">
                  in progress
                </span>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

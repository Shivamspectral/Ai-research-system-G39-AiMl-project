'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lightbulb, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createResearch, type ResearchMode } from '@/lib/api'
import { cn } from '@/lib/utils'

const MAX_CHARS = 2000

const MODES: {
  value: ResearchMode
  label: string
  icon: typeof Building2
  placeholder: string
}[] = [
  {
    value: 'research',
    label: 'Research a company',
    icon: Building2,
    placeholder:
      'e.g. Stripe — payments infrastructure for internet businesses',
  },
  {
    value: 'idea_validation',
    label: 'Validate a startup idea',
    icon: Lightbulb,
    placeholder:
      'e.g. A marketplace connecting local farms directly with restaurants',
  },
]

export function ResearchForm({
  initialText = '',
  initialMode = 'research',
}: {
  initialText?: string
  initialMode?: ResearchMode
}) {
  const router = useRouter()
  const [mode, setMode] = useState<ResearchMode>(initialMode)
  const [text, setText] = useState(initialText)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const overLimit = text.length > MAX_CHARS
  const canSubmit = trimmed.length >= 1 && !overLimit && !submitting
  const activeMode = MODES.find((m) => m.value === mode)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const { research_job_id } = await createResearch({
        mode,
        input_text: trimmed,
      })
      const params = new URLSearchParams({ mode, q: trimmed })
      router.push(`/research/${research_job_id}?${params.toString()}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start research. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        role="radiogroup"
        aria-label="Research mode"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {MODES.map((m) => {
          const Icon = m.icon
          const active = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m.value)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-md',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
              </span>
              {m.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS + 200))}
          placeholder={activeMode.placeholder}
          className="min-h-40"
          aria-label="What do you want to research?"
          aria-invalid={overLimit}
        />
        <div className="flex items-center justify-between text-xs">
          <span
            className={cn(
              'text-muted-foreground',
              trimmed.length === 0 && 'invisible',
            )}
          >
            Every insight in your report will trace back to a source.
          </span>
          <span
            className={cn(
              'font-mono tabular-nums',
              overLimit ? 'text-destructive' : 'text-subtle-foreground',
            )}
          >
            {text.length} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Starting research…
          </>
        ) : (
          <>
            Start research
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}

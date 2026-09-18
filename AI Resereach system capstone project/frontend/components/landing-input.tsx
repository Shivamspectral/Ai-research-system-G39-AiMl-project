'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lightbulb, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ResearchMode } from '@/lib/api'
import { cn } from '@/lib/utils'

const MODES: { value: ResearchMode; label: string; icon: typeof Building2 }[] = [
  { value: 'research', label: 'Research a company', icon: Building2 },
  { value: 'idea_validation', label: 'Validate a startup idea', icon: Lightbulb },
]

export function LandingInput() {
  const router = useRouter()
  const [mode, setMode] = useState<ResearchMode>('research')
  const [text, setText] = useState('')

  function go() {
    const params = new URLSearchParams({ mode })
    if (text.trim()) params.set('q', text.trim())
    router.push(`/research/new?${params.toString()}`)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2 shadow-xs">
      <div className="inline-flex rounded-lg bg-muted p-1">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {m.label}
            </button>
          )
        })}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            (e.metaKey || e.ctrlKey) &&
            !e.nativeEvent.isComposing &&
            e.keyCode !== 229
          ) {
            e.preventDefault()
            go()
          }
        }}
        placeholder={
          mode === 'research'
            ? 'Enter a company name to research…'
            : 'Describe a startup idea to validate…'
        }
        className="mt-2 min-h-28 border-0 shadow-none focus-visible:ring-0"
        aria-label="Company or idea"
      />
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs text-muted-foreground">
          Press{' '}
          <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
            ⌘ Enter
          </kbd>{' '}
          to continue
        </span>
        <Button onClick={go}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

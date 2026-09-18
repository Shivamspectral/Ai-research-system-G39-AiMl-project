'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCw } from 'lucide-react'
import {
  createResearch,
  getResearchStatus,
  streamUrl,
  PIPELINE_STEPS,
  STEP_LABELS,
  type PipelineStep,
  type ResearchMode,
} from '@/lib/api'
import { PageHeader } from '@/components/page-header'
import { PipelineStepper, type StepStatus } from '@/components/pipeline-stepper'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/states'

interface LogEntry {
  id: number
  time: string
  node: string
  label: string
}

const STEP_SET = new Set<string>(PIPELINE_STEPS)

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function ProgressView({
  jobId,
  mode,
  inputText,
}: {
  jobId: string
  mode: ResearchMode
  inputText: string
}) {
  const router = useRouter()
  const [maxDone, setMaxDone] = useState(-1)
  const [log, setLog] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const logId = useRef(0)
  const redirectedRef = useRef(false)

  useEffect(() => {
    setMaxDone(-1)
    setLog([])
    setError(null)

    const es = new EventSource(streamUrl(jobId))

    es.onmessage = (event) => {
      let data: {
        node?: string
        status?: string
        report_id?: string
        message?: string
      }
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }

      if (data.node === 'done' && data.report_id) {
        es.close()
        redirectedRef.current = true
        router.replace(
          `/research/${jobId}/report?reportId=${encodeURIComponent(
            data.report_id,
          )}`,
        )
        return
      }

      if (data.node === 'error') {
        es.close()
        setError(data.message || 'The research pipeline reported an error.')
        return
      }

      if (data.node && STEP_SET.has(data.node) && data.status === 'complete') {
        const idx = PIPELINE_STEPS.indexOf(data.node as PipelineStep)
        setMaxDone((prev) => Math.max(prev, idx))
        setLog((prev) => [
          ...prev,
          {
            id: logId.current++,
            time: fmtTime(new Date()),
            node: data.node as string,
            label: STEP_LABELS[data.node as PipelineStep],
          },
        ])
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects; only surface if not already resolved.
      if (es.readyState === EventSource.CLOSED) {
        setError('Lost connection to the research stream.')
      }
    }

    return () => es.close()
  }, [jobId, router])

  // Fallback for when the SSE stream drops its final "done" message (can
  // happen with dev-mode Fast Refresh or a flaky connection right at the
  // end of a run) even though the backend actually finished. Polling the
  // job status directly means the page redirects on its own within a few
  // seconds instead of getting stuck at 9/9 forever.
  useEffect(() => {
    redirectedRef.current = false

    const interval = setInterval(async () => {
      if (redirectedRef.current) return
      try {
        const { status, report_id } = await getResearchStatus(jobId)
        if (status === 'completed' && report_id && !redirectedRef.current) {
          redirectedRef.current = true
          router.replace(
            `/research/${jobId}/report?reportId=${encodeURIComponent(report_id)}`,
          )
        }
      } catch {
        // transient network hiccup during polling - ignore, next tick retries
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [jobId, router])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log])

  const handleRetry = useCallback(async () => {
    if (!inputText) {
      router.push('/research/new')
      return
    }
    setRetrying(true)
    try {
      const { research_job_id } = await createResearch({
        mode,
        input_text: inputText,
      })
      const params = new URLSearchParams({ mode, q: inputText })
      router.replace(`/research/${research_job_id}?${params.toString()}`)
    } catch {
      setError('Could not restart research. Please try again.')
      setRetrying(false)
    }
  }, [inputText, mode, router])

  const statuses = PIPELINE_STEPS.reduce(
    (acc, step, i) => {
      acc[step] = i <= maxDone ? 'done' : i === maxDone + 1 ? 'current' : 'pending'
      return acc
    },
    {} as Record<PipelineStep, StepStatus>,
  )

  const completed = maxDone + 1
  const total = PIPELINE_STEPS.length

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Researching…"
        description={inputText || 'Running the evidence pipeline for your request.'}
        actions={
          <span className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
            {jobId.slice(0, 12)}
          </span>
        }
      />

      {error ? (
        <div className="mt-8">
          <ErrorState
            title="Research failed"
            message={error}
            onRetry={handleRetry}
            retryLabel={retrying ? 'Retrying…' : 'Try again'}
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Pipeline
              </h2>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {completed} / {total}
              </span>
            </div>
            <PipelineStepper statuses={statuses} />
          </Card>

          <Card className="flex flex-col p-5 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">
                Live activity
              </h2>
            </div>
            <div
              ref={logRef}
              className="h-64 space-y-1.5 overflow-y-auto pr-1"
              aria-live="polite"
            >
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Waiting for the first pipeline event…
                </p>
              ) : (
                log.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-baseline gap-2.5 text-sm"
                  >
                    <span className="font-mono text-xs text-subtle-foreground tabular-nums">
                      {entry.time}
                    </span>
                    <span className="text-foreground">{entry.label}</span>
                    <span className="ml-auto text-xs text-success">done</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {!error ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCw className="size-3 animate-spin" />
          You'll be redirected to your report automatically when the pipeline
          finishes.
        </p>
      ) : null}
    </div>
  )
}

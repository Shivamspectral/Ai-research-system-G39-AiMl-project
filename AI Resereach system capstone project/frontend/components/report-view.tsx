'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Building2,
  Lightbulb,
} from 'lucide-react'
import { getReport, type Report } from '@/lib/api'
import { ConfidenceBadge, ConfidenceBar } from '@/components/confidence-badge'
import { CategoryBadge } from '@/components/category-badge'
import { JsonValue } from '@/components/json-render'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { LoadingState, ErrorState, EmptyState } from '@/components/states'
import { cn } from '@/lib/utils'

function ReportSection({
  title,
  data,
}: {
  title: string
  data: Record<string, unknown> | null
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {data && Object.keys(data).length > 0 ? (
        <Card className="p-5 sm:p-6">
          <JsonValue value={data} />
        </Card>
      ) : (
        <EmptyState
          title="No data for this section"
          description="The pipeline did not produce results here for this run."
        />
      )}
    </section>
  )
}

export function ReportView({ reportId }: { reportId: string | null }) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!reportId) {
      setError('No report ID was provided.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getReport(reportId)
      setReport(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load the report.',
      )
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    load()
  }, [load])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <LoadingState message="Loading your report…" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <ErrorState
          title="Couldn't load report"
          message={error ?? 'The report could not be found.'}
          onRetry={load}
        />
      </div>
    )
  }

  const { content, overall_confidence } = report
  const isIdea = content.mode === 'idea_validation'

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/research/new"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          <ArrowLeft className="size-4" />
          New research
        </Link>
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy link
            </>
          )}
        </Button>
      </div>

      {/* Report header */}
      <header className="mt-6 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {isIdea ? (
              <Lightbulb className="size-3.5" />
            ) : (
              <Building2 className="size-3.5" />
            )}
            {isIdea ? 'Idea Validation' : 'Company Research'}
          </span>
          {content.industry ? (
            <span className="text-xs text-muted-foreground">
              {content.industry}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
          {content.subject_name}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
              Overall confidence
            </p>
            <div className="flex items-center gap-3">
              <ConfidenceBadge value={overall_confidence} />
            </div>
          </div>
        </div>

        {content.context_summary ? (
          <p className="mt-6 text-base leading-relaxed text-foreground text-pretty">
            {content.context_summary}
          </p>
        ) : null}
      </header>

      {/* Analysis sections */}
      <div className="mt-8 space-y-10">
        <ReportSection
          title="Competitor Analysis"
          data={content.competitor_analysis}
        />
        <ReportSection
          title="Market Analysis"
          data={content.market_analysis}
        />
        <ReportSection title="Gap Analysis" data={content.gap_analysis} />

        {/* Evidence */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Evidence
            </h2>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {content.evidence?.length ?? 0} sources
            </span>
          </div>

          {content.evidence && content.evidence.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {content.evidence.map((item, i) => (
                <li key={i}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={item.category} />
                      <ConfidenceBar value={item.confidence} className="ml-auto" />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground text-pretty">
                      {item.claim}
                    </p>
                    {item.source ? (
                      <a
                        href={item.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        <span className="truncate">{item.source}</span>
                      </a>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No evidence recorded"
              description="This report did not include any cited sources."
            />
          )}
        </section>
      </div>

      {/* Footer metadata */}
      <footer className="mt-10 border-t border-border pt-5">
        <p className="font-mono text-xs text-subtle-foreground">
          {content.iterations_run} iteration
          {content.iterations_run === 1 ? '' : 's'} run · report{' '}
          {report.id}
        </p>
      </footer>
    </article>
  )
}

import { ProgressView } from '@/components/progress-view'
import type { ResearchMode } from '@/lib/api'

export default async function ResearchProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>
  searchParams: Promise<{ mode?: string; q?: string }>
}) {
  const { jobId } = await params
  const { mode, q } = await searchParams
  const resolvedMode: ResearchMode =
    mode === 'idea_validation' ? 'idea_validation' : 'research'

  return (
    <ProgressView jobId={jobId} mode={resolvedMode} inputText={q ?? ''} />
  )
}

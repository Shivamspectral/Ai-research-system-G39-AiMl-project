import { PageHeader } from '@/components/page-header'
import { ResearchForm } from '@/components/research-form'
import type { ResearchMode } from '@/lib/api'

export default async function NewResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; q?: string }>
}) {
  const { mode, q } = await searchParams
  const initialMode: ResearchMode =
    mode === 'idea_validation' ? 'idea_validation' : 'research'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="What do you want to research?"
        description="Choose a mode and give us something to work with. We'll run the full pipeline and return an evidence-backed report."
      />
      <div className="mt-8">
        <ResearchForm initialMode={initialMode} initialText={q ?? ''} />
      </div>
    </div>
  )
}

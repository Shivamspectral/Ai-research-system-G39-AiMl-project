export type ResearchMode = 'research' | 'idea_validation'

export interface CreateResearchBody {
  mode: ResearchMode
  input_text: string
}

export interface CreateResearchResponse {
  research_job_id: string
  status: string
}

export interface ResearchStatus {
  status: string
  report_id: string | null
}

export interface EvidenceItem {
  claim: string
  category: string
  source: string
  confidence: number
}

export interface ReportContent {
  subject_name: string
  mode: ResearchMode
  industry: string
  context_summary: string
  competitor_analysis: Record<string, unknown> | null
  market_analysis: Record<string, unknown> | null
  gap_analysis: Record<string, unknown> | null
  evidence: EvidenceItem[]
  iterations_run: number
}

export interface Report {
  id: string
  research_job_id: string
  content: ReportContent
  overall_confidence: number
}

/** Ordered list of pipeline nodes shown in the stepper. */
export const PIPELINE_STEPS = [
  'understand_idea',
  'plan_research',
  'search',
  'extract_evidence',
  'verify_evidence',
  'competitor_analysis',
  'market_analysis',
  'gap_analysis',
  'generate_report',
] as const

export type PipelineStep = (typeof PIPELINE_STEPS)[number]

export const STEP_LABELS: Record<PipelineStep, string> = {
  understand_idea: 'Understand Idea',
  plan_research: 'Plan Research',
  search: 'Search',
  extract_evidence: 'Extract Evidence',
  verify_evidence: 'Verify Evidence',
  competitor_analysis: 'Competitor Analysis',
  market_analysis: 'Market Analysis',
  gap_analysis: 'Gap Analysis',
  generate_report: 'Generate Report',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export function apiUrl(path: string): string {
  return `${API_URL}${path}`
}

export async function createResearch(
  body: CreateResearchBody,
): Promise<CreateResearchResponse> {
  const res = await fetch(apiUrl('/api/research'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Failed to start research (${res.status})`)
  }
  return res.json()
}

export async function getResearchStatus(jobId: string): Promise<ResearchStatus> {
  const res = await fetch(apiUrl(`/api/research/${jobId}/status`))
  if (!res.ok) {
    throw new Error(`Failed to load status (${res.status})`)
  }
  return res.json()
}

export async function getReport(reportId: string): Promise<Report> {
  const res = await fetch(apiUrl(`/api/reports/${reportId}`))
  if (!res.ok) {
    throw new Error(`Failed to load report (${res.status})`)
  }
  return res.json()
}

export function streamUrl(jobId: string): string {
  return apiUrl(`/api/research/${jobId}/stream`)
}

import { ReportView } from '@/components/report-view'

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ reportId?: string }>
}) {
  const { reportId } = await searchParams
  return <ReportView reportId={reportId ?? null} />
}

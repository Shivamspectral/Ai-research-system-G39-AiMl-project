import { TrendingUp, Users, SearchX, Link2 } from 'lucide-react'
import { LandingInput } from '@/components/landing-input'

const CAPABILITIES = [
  {
    icon: TrendingUp,
    title: 'Market Analysis',
    description:
      'Size the opportunity, map trends, and understand where the market is heading.',
  },
  {
    icon: Users,
    title: 'Competitor Analysis',
    description:
      'See who else is in the space and how they position, price, and differentiate.',
  },
  {
    icon: SearchX,
    title: 'Gap Analysis',
    description:
      'Surface unmet needs and whitespace competitors have left on the table.',
  },
  {
    icon: Link2,
    title: 'Evidence Trail',
    description:
      'Every insight is backed by a verifiable source you can click through and check.',
  },
]

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <section className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Evidence-backed by design
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Turn a company or idea into an evidence-backed research report.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
          Run a multi-step research pipeline that searches, verifies, and
          analyzes — then hands you a report where every claim traces back to a
          source.
        </p>
      </section>

      <div className="mt-8">
        <LandingInput />
      </div>

      <section className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon
          return (
            <div
              key={cap.title}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-3.5 text-sm font-semibold text-foreground">
                {cap.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                {cap.description}
              </p>
            </div>
          )
        })}
      </section>
    </div>
  )
}

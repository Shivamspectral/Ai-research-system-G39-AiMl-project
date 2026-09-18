import { cn } from '@/lib/utils'

function titleCase(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function Primitive({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-subtle-foreground">—</span>
  }
  if (typeof value === 'boolean') {
    return (
      <span className="font-mono text-sm">{value ? 'Yes' : 'No'}</span>
    )
  }
  if (typeof value === 'number') {
    return <span className="font-mono text-sm tabular-nums">{value}</span>
  }
  return (
    <span className="text-sm leading-relaxed text-foreground">
      {String(value)}
    </span>
  )
}

/** Recursively renders an arbitrary JSON value into readable, labeled markup. */
export function JsonValue({
  value,
  depth = 0,
}: {
  value: unknown
  depth?: number
}) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-subtle-foreground">—</span>
    }
    const allPrimitive = value.every(
      (v) => !isPlainObject(v) && !Array.isArray(v),
    )
    if (allPrimitive) {
      return (
        <ul className="flex flex-col gap-1">
          {value.map((v, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
              <Primitive value={v} />
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="flex flex-col gap-3">
        {value.map((v, i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-muted/40 p-3"
          >
            <JsonValue value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return <span className="text-subtle-foreground">—</span>
    }
    return (
      <dl className={cn('flex flex-col', depth === 0 ? 'gap-5' : 'gap-3')}>
        {entries.map(([key, val]) => {
          const nested = isPlainObject(val) || Array.isArray(val)
          return (
            <div
              key={key}
              className={cn(nested ? 'space-y-2' : 'space-y-1')}
            >
              <dt
                className={cn(
                  'font-medium text-foreground',
                  depth === 0 ? 'text-sm' : 'text-xs',
                )}
              >
                {titleCase(key)}
              </dt>
              <dd className={cn(nested && 'border-l-2 border-border pl-3.5')}>
                <JsonValue value={val} depth={depth + 1} />
              </dd>
            </div>
          )
        })}
      </dl>
    )
  }

  return <Primitive value={value} />
}

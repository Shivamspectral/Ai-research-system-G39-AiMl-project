'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSearch, Menu, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [{ label: 'New Research', href: '/research/new', icon: Plus }]

function breadcrumbFor(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname === '/research/new') return 'New Research'
  if (pathname.endsWith('/report')) return 'Research Report'
  if (pathname.startsWith('/research/')) return 'Research Progress'
  return 'Evidence'
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-0.5 px-4 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileSearch className="size-4" />
          </span>
          Evidence
        </Link>
        <p className="pl-9 text-xs text-muted-foreground text-pretty">
          Evidence-backed research reports
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
          >
            RA
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              Research Analyst
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Signed out
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      {/* Tablet icon rail */}
      <aside className="hidden w-16 shrink-0 border-r border-sidebar-border bg-sidebar md:block lg:hidden">
        <div className="sticky top-0 flex h-svh flex-col items-center gap-4 py-5">
          <Link
            href="/"
            aria-label="Evidence home"
            className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <FileSearch className="size-4" />
          </Link>
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  'flex size-9 items-center justify-center rounded-md transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-4" />
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">
          <SidebarContent pathname={pathname} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar shadow-lg">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Evidence</span>
            <span className="text-subtle-foreground">/</span>
            <span className="font-medium text-foreground">
              {breadcrumbFor(pathname)}
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

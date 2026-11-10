import { cn } from 'cn'
import { useMemo, useState } from 'react'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { Pager } from '@/components/ui/pager'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { MemberRow } from './api'
import { useMembers } from './hooks'
import { AddMemberDialog } from './AddMemberDialog'
import { MemberSheet } from './MemberSheet'
import { MembersTabs } from './MembersTabs'

type Filter = 'active' | 'admins' | 'writers' | 'unclaimed' | 'left' | 'all'

const FILTERS: { id: Filter; label: string; test: (m: MemberRow) => boolean }[] = [
  { id: 'active', label: 'Active', test: (m) => !m.left_at },
  { id: 'admins', label: 'Admins', test: (m) => m.is_admin },
  { id: 'writers', label: 'Writers', test: (m) => m.writer && !m.left_at },
  { id: 'unclaimed', label: 'No account yet', test: (m) => !m.claimed && !m.left_at },
  { id: 'left', label: 'Left', test: (m) => !!m.left_at },
  { id: 'all', label: 'Everyone', test: () => true },
]

const PAGE_SIZE = 15

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

export function Chip({ tone, children }: { tone: 'cyan' | 'purple' | 'amber' | 'dim'; children: string }) {
  return (
    <span
      className={cn(
        'rounded-[5px] border px-1.5 py-px text-[10px] font-extrabold uppercase tracking-[0.08em]',
        tone === 'cyan' && 'border-astro-cyan/45 text-astro-cyan',
        tone === 'purple' && 'border-astro-accent/45 text-astro-accent-soft',
        tone === 'amber' && 'border-astro-amber/45 text-astro-amber',
        tone === 'dim' && 'border-white/[0.14] text-astro-text-dim',
      )}
    >
      {children}
    </span>
  )
}

export function MemberChips({ m }: { m: MemberRow }) {
  return (
    <>
      {m.left_at && <Chip tone="dim">Left</Chip>}
      {m.is_admin && <Chip tone="cyan">Admin</Chip>}
      {m.writer && <Chip tone="purple">Writer</Chip>}
      {!m.claimed && !m.left_at && <Chip tone="amber">No account</Chip>}
      {m.claimed && !m.onboarded_at && !m.left_at && <Chip tone="dim">Setting up</Chip>}
    </>
  )
}

export function MembersPage() {
  const { data: members = [], isLoading, isError, refetch } = useMembers()
  const [filter, setFilter] = useState<Filter>('active')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const test = FILTERS.find((f) => f.id === filter)!.test
    return members.filter((m) => test(m) && (!q || m.nickname.toLowerCase().includes(q) || m.full_name.toLowerCase().includes(q)))
  }, [members, filter, query])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const open = members.find((m) => m.id === openId) ?? null

  return (
    <div className="max-w-[980px]">
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Govern</div>
      <h1 className="mb-2 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Members</h1>
      <p className="mb-5 max-w-[62ch] text-sm text-astro-text-muted">
        Everyone who&rsquo;s ever been on the books. Edit details, hand out roles, and mark people who&rsquo;ve left. Leaving keeps their
        history, it just takes them off the roster and the pickers.
      </p>
      <MembersTabs />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const n = members.filter(f.test).length
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => {
                    setFilter(f.id)
                    setPage(1)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-bold transition-colors',
                    filter === f.id ? 'border-astro-cyan/60 bg-astro-cyan/[0.12] text-astro-text' : 'border-white/[0.09] text-astro-text-muted hover:text-astro-text',
                  )}
                >
                  {f.label}
                  <span className="text-[11px] text-astro-text-dim">{n}</span>
                </button>
              )
            })}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Find a member"
              aria-label="Find a member"
              className="min-h-9 min-w-0 flex-[1_1_220px] rounded-[9px] border border-white/[0.1] bg-astro-admin-card px-3 text-[13px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-cyan/60 focus:outline-none sm:max-w-xs"
            />
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="ml-auto rounded-[9px] border border-astro-cyan/50 px-3.5 py-2 text-[12.5px] font-extrabold text-astro-cyan hover:bg-astro-cyan/[0.08]"
            >
              + Add a player
            </button>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-white/[0.09] bg-astro-admin-card">
            {rows.length === 0 ? (
              <p className="p-5 text-[13px] text-astro-text-dim">Nobody matches that.</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {visible.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(m.id)}
                      className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03]', m.left_at && 'opacity-60')}
                    >
                      <PlayerPhoto playerId={m.id} alt="" className="size-9 shrink-0 rounded-[9px]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[14px] font-extrabold text-astro-text">{m.nickname}</span>
                          <MemberChips m={m} />
                        </span>
                        <span className="block truncate text-[12px] text-astro-text-dim">
                          {m.full_name}
                          {m.positions.length > 0 && ` · ${m.positions.join(' / ')}`}
                        </span>
                      </span>
                      <span className="hidden w-16 shrink-0 text-right sm:block">
                        <span className="block font-display text-[18px] leading-none text-astro-text">{m.appearances}</span>
                        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">Apps</span>
                      </span>
                      <span className="hidden w-20 shrink-0 text-right text-[11.5px] text-astro-text-dim md:block">
                        {m.left_at ? `Left ${shortDate(m.left_at)}` : `Since ${shortDate(m.joined_at)}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Pager
            className="mt-3"
            page={current}
            pageSize={PAGE_SIZE}
            total={rows.length}
            noun={rows.length === 1 ? 'member' : 'members'}
            onPageChange={(p) => {
              setPage(p)
              document.querySelector('main')?.scrollIntoView({ block: 'start' })
            }}
          />
        </>
      )}

      <MemberSheet member={open} onOpenChange={(o) => !o && setOpenId(null)} />
      <AddMemberDialog open={adding} onOpenChange={setAdding} onCreated={(id) => setOpenId(id)} />
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { Button } from '@/components/ui/button'
import { AstroSelect } from '@/components/ui/astro-select'
import { useArticles, useDrafts, useSetWriter, useWriters } from '@/features/articles/hooks'
import { usePlayerCards } from '@/features/players/hooks'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Writers() {
  const { data: writers = [], isLoading, isError, refetch } = useWriters()
  const { data: players = [] } = usePlayerCards()
  const setWriter = useSetWriter()
  const [pick, setPick] = useState('')
  const writerIds = new Set(writers.map((w) => w.playerId))
  const options = players.filter((p) => !writerIds.has(p.id)).map((p) => ({ value: p.id, label: p.nickname }))

  const toggle = (playerId: string, on: boolean, name: string) =>
    setWriter.mutate(
      { playerId, on },
      {
        onSuccess: () => {
          if (on) setPick('')
          toast.success(on ? `${name} can write articles now.` : `${name} can’t write articles any more.`)
        },
        onError: () => toast.error('Couldn’t change that. Try again.'),
      },
    )

  return (
    <section className="mb-8">
      <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">Who can write</h2>
      <p className="mb-3 max-w-[62ch] text-[13px] text-astro-text-muted">
        Admins can always write. Anyone else needs access from here. Taking it away keeps what they&rsquo;ve published, but they can&rsquo;t edit it or start anything new.
      </p>
      <div className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <AstroSelect size="sm" aria-label="Player" placeholder="Pick a player" value={pick} onValueChange={setPick} options={options} className="min-w-0 flex-[1_1_220px]" />
          <Button
            size="sm"
            disabled={!pick || setWriter.isPending}
            onClick={() => toggle(pick, true, players.find((p) => p.id === pick)?.nickname ?? 'They')}
          >
            Give write access
          </Button>
        </div>
        {isLoading ? (
          <div className="py-2 text-xs text-astro-text-dim">Loading…</div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : writers.length === 0 ? (
          <p className="py-1 text-[13px] text-astro-text-dim">Nobody besides the admins yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {writers.map((w) => (
              <li key={w.playerId} className="flex items-center gap-3 py-2.5">
                <Link to="/players/$playerId" params={{ playerId: w.playerId }} className="min-w-0 flex-1 truncate text-[14px] font-extrabold text-astro-text hover:underline">
                  {w.nickname}
                </Link>
                <span className="shrink-0 text-xs text-astro-text-dim">Since {shortDate(w.grantedAt)}</span>
                <button
                  type="button"
                  disabled={setWriter.isPending}
                  onClick={() => toggle(w.playerId, false, w.nickname)}
                  className="shrink-0 rounded-lg border border-white/[0.12] px-3 py-1 text-xs font-bold text-astro-text-muted hover:border-astro-red/60 hover:text-astro-red disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function AllArticles() {
  const published = useArticles()
  const drafts = useDrafts(true)
  if (published.isLoading || drafts.isLoading) return <PageLoader />
  const rows = [...(drafts.data ?? []), ...(published.data ?? [])]
  return (
    <section>
      <div className="mb-2.5 flex items-baseline gap-3">
        <h2 className="font-display text-[28px] leading-none text-astro-text">Articles</h2>
        <Link to="/articles/new" className="ml-auto text-[13px] font-extrabold text-astro-cyan no-underline hover:underline">
          Write one &rarr;
        </Link>
      </div>
      <div className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card">
        {rows.length === 0 ? (
          <p className="p-4 text-[13px] text-astro-text-dim">Nothing written yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="min-w-0 flex-[1_1_220px] truncate text-[14px] font-bold text-astro-text">{a.title || 'Untitled'}</span>
                <span className="text-xs text-astro-text-dim">{a.author?.nickname ?? 'Admin'}</span>
                <span className={a.published_at ? 'text-xs font-bold text-astro-green' : 'text-xs font-bold text-astro-text-dim'}>
                  {a.published_at ? shortDate(a.published_at) : 'Draft'}
                </span>
                <Link to="/articles/$articleId/edit" params={{ articleId: a.id }} className="text-xs font-extrabold text-astro-cyan no-underline hover:underline">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function ArticlesAdminPage() {
  return (
    <div className="max-w-[860px]">
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">The masthead</div>
      <h1 className="mb-2 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Articles</h1>
      <p className="mb-6 max-w-[62ch] text-sm text-astro-text-muted">Writing happens in the app, under Articles. Here you decide who gets to.</p>
      <Writers />
      <AllArticles />
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ErrorState } from '@/components/states/ErrorState'
import { NothingHere } from '@/components/states/NothingHere'
import { PageLoader } from '@/components/states/PageLoader'
import { Scene } from '@/components/states/Scene'
import { useArticles, useDrafts, useWriters } from '@/features/articles/hooks'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Writers() {
  const { data: writers = [], isLoading, isError, refetch } = useWriters()

  return (
    <section className="mb-8">
      <div className="mb-1 flex items-baseline gap-3">
        <h2 className="font-display text-[28px] leading-none text-astro-text">Who can write</h2>
        <Link to="/admin/members" search={{ filter: 'writers' }} className="ml-auto text-[13px] font-extrabold text-astro-cyan no-underline hover:underline">
          Change in Members &rarr;
        </Link>
      </div>
      <p className="mb-3 max-w-[62ch] text-[13px] text-astro-text-muted">
        Admins can always write. Anyone else gets access from their card in Members. Taking it away keeps what they&rsquo;ve published, but they can&rsquo;t edit it or start anything new.
      </p>
      <div className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
        {isLoading ? (
          <div className="py-2 text-xs text-astro-text-dim">Loading…</div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : writers.length === 0 ? (
          <NothingHere compact icon={<Scene kind="notebook" />} title="No other writers" body="Only admins can write for now." />
        ) : (
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {writers.map((w) => (
              <li key={w.playerId} className="flex items-center gap-3 py-2.5">
                <Link to="/players/$playerId" params={{ playerId: w.playerId }} className="min-w-0 flex-1 truncate text-[14px] font-extrabold text-astro-text hover:underline">
                  {w.nickname}
                </Link>
                <span className="shrink-0 text-xs text-astro-text-dim">Since {shortDate(w.grantedAt)}</span>
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
          <div className="p-3">
            <NothingHere
              compact
              icon={<Scene kind="notebook" />}
              title="Nothing written yet"
              body="Drafts and published pieces show up here."
              action={
                <Link to="/articles/new" className="rounded-[10px] border border-astro-cyan/50 px-4 py-2 text-xs font-extrabold text-astro-cyan no-underline hover:bg-astro-cyan/[0.08]">
                  Write the first one
                </Link>
              }
            />
          </div>
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
      <p className="mb-6 max-w-[62ch] text-sm text-astro-text-muted">Writing happens in the app, under Articles. Every piece, published or draft, is here.</p>
      <Writers />
      <AllArticles />
    </div>
  )
}

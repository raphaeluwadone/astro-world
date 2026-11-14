import { Link } from '@tanstack/react-router'
import { Scene } from '@/components/states/Scene'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { toPlainText } from '@/components/editor/markdown'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useArticles, useCanWrite, useDrafts } from './hooks'

function blurb(body: string) {
  const text = toPlainText(body)
  return text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text
}

function Drafts() {
  const { player } = useCurrentPlayer()
  const { data: drafts = [] } = useDrafts(true)
  if (drafts.length === 0) return null
  return (
    <div className="astro-card mb-6 p-4">
      <div className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{player?.is_admin ? 'Drafts' : 'Your drafts'}</div>
      <div className="flex flex-col gap-1">
        {drafts.map((d) => (
          <Link
            key={d.id}
            to="/articles/$articleId/edit"
            params={{ articleId: d.id }}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 no-underline hover:bg-white/[0.04]"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-astro-text">{d.title || 'Untitled'}</span>
            {d.author && d.author.id !== player?.id && <span className="shrink-0 text-xs text-astro-text-dim">{d.author.nickname}</span>}
            <span className="shrink-0 text-xs font-extrabold text-astro-accent-soft">Edit &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ArticlesPage() {
  const { data: articles = [], isLoading, isError, refetch } = useArticles()
  const { data: canWrite } = useCanWrite()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Articles</h1>
          <p className="text-sm text-astro-text-muted">Match reports nobody asked for.</p>
        </div>
        {canWrite && (
          <Link
            to="/articles/new"
            className="rounded-[10px] bg-astro-accent px-4 py-2.5 text-[13px] font-extrabold text-white no-underline hover:opacity-90"
          >
            Write an article
          </Link>
        )}
      </div>
      {canWrite && <Drafts />}

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : articles.length === 0 ? (
        <EmptyState icon={<Scene kind="notebook" />} title="Nothing published yet." body="Match reports land here once someone writes one." />
      ) : (
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {articles.map((a) => (
            <Link
              key={a.id}
              to="/articles/$articleId"
              params={{ articleId: a.id }}
              className="astro-card group block overflow-hidden no-underline transition-colors hover:border-astro-accent/40"
            >
              {a.cover_image_url ? (
                <img src={a.cover_image_url} alt="" loading="lazy" className="h-[150px] w-full object-cover" />
              ) : (
                <div className="h-[150px]" style={{ background: 'linear-gradient(150deg, #243463, #131c3a)' }} />
              )}
              <div className="p-[18px]">
                {a.kicker && (
                  <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-accent">
                    {a.kicker}
                  </div>
                )}
                <div className="font-display mb-2 text-[25px] leading-[1.05] text-astro-text [text-wrap:pretty] group-hover:underline">
                  {a.title}
                </div>
                <p className="text-[13px] leading-[1.5] text-astro-text-muted [text-wrap:pretty]">
                  {blurb(a.body)}
                </p>
                {a.published_at && (
                  <div className="mt-3 text-[11.5px] text-astro-text-dim">
                    {a.author && `${a.author.nickname} · `}
                    {new Date(a.published_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

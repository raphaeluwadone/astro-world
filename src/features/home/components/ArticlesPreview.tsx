import { Link } from '@tanstack/react-router'
import type { ArticleRow } from '@/features/articles/api'

export function ArticlesPreview({ articles }: { articles: ArticleRow[] }) {
  const recent = articles.slice(0, 2)
  return (
    <div className="astro-card p-[22px]">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Articles</h2>
        <Link to="/articles" className="text-xs font-extrabold text-astro-accent">
          All
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-astro-text-dim">No articles published yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((a) => (
            <div key={a.id} className="flex items-center gap-3.5">
              <div
                className="h-14 w-[72px] shrink-0 rounded-[10px]"
                style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
              />
              <div className="min-w-0">
                {a.kicker && (
                  <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-accent">
                    {a.kicker}
                  </div>
                )}
                <div className="text-sm font-bold text-astro-text [text-wrap:pretty]">{a.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

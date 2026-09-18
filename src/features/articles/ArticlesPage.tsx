import { useArticles } from './hooks'

function blurb(body: string) {
  return body.length > 140 ? `${body.slice(0, 140).trimEnd()}…` : body
}

export function ArticlesPage() {
  const { data: articles = [], isLoading } = useArticles()

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Articles
      </h1>
      <p className="mb-6 text-sm text-astro-text-muted">Match reports nobody asked for.</p>

      {isLoading ? (
        <p className="text-sm text-astro-text-dim">Loading&hellip;</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-astro-text-dim">No articles published yet.</p>
      ) : (
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {articles.map((a) => (
            <div key={a.id} className="astro-card overflow-hidden">
              <div
                className="h-[150px]"
                style={{ background: 'linear-gradient(150deg, #243463, #131c3a)' }}
              />
              <div className="p-[18px]">
                {a.kicker && (
                  <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-accent">
                    {a.kicker}
                  </div>
                )}
                <div className="font-display mb-2 text-[25px] leading-[1.05] text-astro-text [text-wrap:pretty]">
                  {a.title}
                </div>
                <p className="text-[13px] leading-[1.5] text-astro-text-muted [text-wrap:pretty]">
                  {blurb(a.body)}
                </p>
                {a.published_at && (
                  <div className="mt-3 text-[11.5px] text-astro-text-dim">
                    {new Date(a.published_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

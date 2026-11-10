import { Link, useNavigate } from '@tanstack/react-router'
import { BackLink as BackToArticles } from '@/components/navigation/BackLink'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { useArticle } from './hooks'

function BackLink() {
  return <BackToArticles to="/articles" label="Back to articles" className="mb-6" />
}

export function ArticlePage({ articleId }: { articleId: string }) {
  const navigate = useNavigate()
  const { data: article, isLoading, isError, refetch } = useArticle(articleId)

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!article)
    return (
      <div className="mx-auto max-w-[680px]">
        <BackLink />
        <EmptyState
          icon={<EmptyPitchIcon />}
          title="That article isn't here."
          body="It may have been taken down, or the link is wrong."
          action={{ label: 'See all articles', onClick: () => navigate({ to: '/articles' }) }}
        />
      </div>
    )

  const paragraphs = article.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <article className="mx-auto max-w-[680px]">
      <BackLink />
      {article.kicker && (
        <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-astro-accent">{article.kicker}</div>
      )}
      <h1 className="font-display mb-3 text-[40px] leading-[0.95] text-astro-text [text-wrap:balance] md:text-[56px]">
        {article.title}
      </h1>
      {article.published_at && (
        <div className="mb-6 text-[12.5px] text-astro-text-dim">
          {new Date(article.published_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
      {article.cover_image_url ? (
        <img src={article.cover_image_url} alt="" className="mb-7 aspect-[16/9] w-full rounded-[14px] object-cover" />
      ) : (
        <div className="mb-7 aspect-[16/7] w-full rounded-[14px]" style={{ background: 'linear-gradient(150deg, #243463, #131c3a)' }} />
      )}
      <div className="flex flex-col gap-4.5">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line text-[16px] leading-[1.7] text-astro-text [text-wrap:pretty]">
            {p}
          </p>
        ))}
      </div>
      <div className="mt-10 border-t border-white/[0.07] pt-5">
        <Link to="/articles" className="text-[13px] font-extrabold text-astro-accent no-underline">
          More articles &rarr;
        </Link>
      </div>
    </article>
  )
}

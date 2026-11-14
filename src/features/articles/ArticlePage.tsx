import { Link, useNavigate } from '@tanstack/react-router'
import { Scene } from '@/components/states/Scene'
import { BackLink as BackToArticles } from '@/components/navigation/BackLink'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { RichText } from '@/components/editor/RichText'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useArticle, useCanWrite } from './hooks'

function BackLink() {
  return <BackToArticles to="/articles" label="Back to articles" className="mb-6" />
}

export function ArticlePage({ articleId }: { articleId: string }) {
  const navigate = useNavigate()
  const { data: article, isLoading, isError, refetch } = useArticle(articleId)
  const { player } = useCurrentPlayer()
  const { data: canWrite } = useCanWrite()

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!article)
    return (
      <div className="mx-auto max-w-[680px]">
          <BackLink />
        <EmptyState
          icon={<Scene kind="notebook" />}
          title="That article isn't here."
          body="It may have been taken down, or the link is wrong."
          action={{ label: 'See all articles', onClick: () => navigate({ to: '/articles' }) }}
        />
      </div>
    )

  const canEdit = canWrite && (article.author?.id === player?.id || player?.is_admin)

  return (
    <article className="mx-auto max-w-[680px]">
      <div className="flex items-center gap-3">
        <BackLink />
        {canEdit && (
          <Link
            to="/articles/$articleId/edit"
            params={{ articleId: article.id }}
            className="mb-6 ml-auto rounded-[9px] border border-white/[0.12] px-3 py-1.5 text-[12.5px] font-extrabold text-astro-text no-underline hover:border-astro-accent/60"
          >
            Edit
          </Link>
        )}
      </div>
      {!article.published_at && (
        <div className="mb-4 rounded-xl border border-astro-amber/40 bg-astro-amber/[0.08] px-4 py-2.5 text-[13px] text-astro-amber">
          Draft. Only the author and the admins can see this.
        </div>
      )}
      {article.kicker && (
        <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-astro-accent">{article.kicker}</div>
      )}
      <h1 className="font-display mb-3 text-[40px] leading-[0.95] text-astro-text [text-wrap:balance] md:text-[56px]">
        {article.title}
      </h1>
      {article.published_at && (
        <div className="mb-6 text-[12.5px] text-astro-text-dim">
          {article.author && <span className="font-bold text-astro-text-muted">{article.author.nickname} · </span>}
          {new Date(article.published_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
      {article.cover_image_url ? (
        <img src={article.cover_image_url} alt="" className="mb-7 aspect-[16/9] w-full rounded-[14px] object-cover" />
      ) : (
        <div className="mb-7 aspect-[16/7] w-full rounded-[14px]" style={{ background: 'linear-gradient(150deg, #243463, #131c3a)' }} />
      )}
      <RichText content={article.body} variant="article" gap="gap-4.5" className="text-[16px] leading-[1.7] text-astro-text [text-wrap:pretty]" />
      <div className="mt-10 border-t border-white/[0.07] pt-5">
        <Link to="/articles" className="text-[13px] font-extrabold text-astro-accent no-underline">
          More articles &rarr;
        </Link>
      </div>
    </article>
  )
}

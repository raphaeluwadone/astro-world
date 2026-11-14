import { createFileRoute } from '@tanstack/react-router'
import { ArticlePage } from '@/features/articles/ArticlePage'

export const Route = createFileRoute('/_app/articles/$articleId')({
  component: ArticleRoute,
})

function ArticleRoute() {
  const { articleId } = Route.useParams()
  return <ArticlePage articleId={articleId} />
}

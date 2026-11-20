import { createFileRoute } from '@tanstack/react-router'
import { ArticleEditorPage } from '@/features/articles/ArticleEditorPage'

export const Route = createFileRoute('/_app/articles/$articleId_/edit')({
  component: EditRoute,
})

function EditRoute() {
  const { articleId } = Route.useParams()
  return <ArticleEditorPage articleId={articleId} />
}

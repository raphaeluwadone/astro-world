import { createFileRoute } from '@tanstack/react-router'
import { ArticleEditorPage } from '@/features/articles/ArticleEditorPage'

export const Route = createFileRoute('/_app/articles/new')({
  component: () => <ArticleEditorPage />,
})

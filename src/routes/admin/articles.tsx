import { createFileRoute } from '@tanstack/react-router'
import { ArticlesAdminPage } from '@/features/admin/ArticlesAdminPage'

export const Route = createFileRoute('/admin/articles')({
  component: ArticlesAdminPage,
})

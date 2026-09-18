import { createFileRoute } from '@tanstack/react-router'
import { EditProfilePage } from '@/features/edit-profile/EditProfilePage'

export const Route = createFileRoute('/_app/profile/edit')({
  component: EditProfilePage,
})

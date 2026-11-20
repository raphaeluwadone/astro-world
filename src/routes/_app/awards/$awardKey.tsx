import { createFileRoute } from '@tanstack/react-router'
import { AwardPage } from '@/features/badges/AwardPage'
import { ShirtAwardPage } from '@/features/teams/ShirtAwardPage'

export const Route = createFileRoute('/_app/awards/$awardKey')({
  component: function AwardRoute() {
    const { awardKey } = Route.useParams()
    if (awardKey === 'shirt-of-the-year') return <ShirtAwardPage />
    return <AwardPage key={awardKey} awardKey={awardKey} />
  },
})

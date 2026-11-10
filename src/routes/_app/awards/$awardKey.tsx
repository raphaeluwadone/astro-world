import { createFileRoute } from '@tanstack/react-router'
import { AwardPage } from '@/features/badges/AwardPage'

export const Route = createFileRoute('/_app/awards/$awardKey')({
  component: function AwardRoute() {
    const { awardKey } = Route.useParams()
    return <AwardPage key={awardKey} awardKey={awardKey} />
  },
})

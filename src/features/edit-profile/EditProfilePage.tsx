import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useTagPool } from '@/features/community/hooks'
import { useCareerStats, useMatchRatings, usePlayerTags } from '@/features/profile/hooks'
import { CardPhotoCard } from './components/CardPhotoCard'
import { DetailsCard, type DraftFields } from './components/DetailsCard'
import { LeaveGroupCard } from './components/LeaveGroupCard'
import { LockedFieldsCard } from './components/LockedFieldsCard'
import { SelfTagsCard } from './components/SelfTagsCard'
import { useAddSelfTag, useRemoveSelfTag, useUpdatePlayer } from './hooks'
import type { Player } from '@/features/profile/api'

function toDraft(player: Player): DraftFields {
  return {
    nickname: player.nickname,
    full_name: player.full_name,
    height_cm: player.height_cm?.toString() ?? '',
    weight_kg: player.weight_kg?.toString() ?? '',
    favourite_number: player.favourite_number?.toString() ?? '',
    favourite_club: player.favourite_club ?? '',
    bio: player.bio ?? '',
    positions: player.positions,
    preferred_foot: player.preferred_foot,
  }
}

function average(nums: number[]) {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

export function EditProfilePage() {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const playerId = player?.id

  const { data: matchRatings = [] } = useMatchRatings(playerId)
  const { data: careerStats } = useCareerStats(playerId)
  const { data: tags = [] } = usePlayerTags(playerId)
  const { data: tagPool = [] } = useTagPool()

  const updatePlayer = useUpdatePlayer(playerId)
  const addSelfTag = useAddSelfTag(playerId)
  const removeSelfTag = useRemoveSelfTag(playerId)

  const [draft, setDraft] = useState<DraftFields | null>(null)
  if (player && !draft) {
    // Initialize local edit state from the fetched player the first time
    // it's available: a conditional setState during render, not an
    // effect, since this only ever needs to run once per player load.
    setDraft(toDraft(player))
  }

  if (!player || !draft) {
    return <PageLoader />
  }

  const careerAvg = average(matchRatings.map((r) => r.avg_rating))
  const communityTags = tags.filter((t) => t.source === 'community')

  function patch(fields: Partial<DraftFields>) {
    setDraft((d) => (d ? { ...d, ...fields } : d))
  }

  async function save() {
    if (!draft) return
    await updatePlayer.mutateAsync({
      nickname: draft.nickname,
      full_name: draft.full_name,
      height_cm: draft.height_cm ? Number(draft.height_cm) : null,
      weight_kg: draft.weight_kg ? Number(draft.weight_kg) : null,
      favourite_number: draft.favourite_number ? Number(draft.favourite_number) : null,
      favourite_club: draft.favourite_club || null,
      bio: draft.bio || null,
      positions: draft.positions,
      preferred_foot: draft.preferred_foot,
    })
    navigate({ to: '/profile' })
  }

  return (
    <div>
      <Link
        to="/profile"
        className="mb-[18px] inline-flex items-center gap-[7px] text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
        </svg>
        Back to profile
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
            Edit Profile
          </h1>
          <p className="mt-1.5 max-w-[58ch] text-sm text-astro-text-muted [text-wrap:pretty]">
            You own who you are. The group owns how good you are.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/profile"
            className="rounded-[11px] border border-border bg-astro-surface-2 px-5 py-3 text-[13.5px] font-bold text-astro-text-muted"
          >
            Discard
          </Link>
          <button
            type="button"
            disabled={updatePlayer.isPending}
            onClick={save}
            className="flex items-center gap-2 rounded-[11px] bg-astro-accent px-[22px] py-3 text-[13.5px] font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {updatePlayer.isPending && <InlineLoader size={16} />}
            {updatePlayer.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div
        className="grid items-start gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}
      >
        <div className="flex min-w-0 flex-col gap-5">
          <DetailsCard draft={draft} onChange={patch} />
          <SelfTagsCard
            allTags={tags}
            tagPool={tagPool}
            onAdd={(tagId) => addSelfTag.mutate(tagId)}
            onRemove={(rowId) => removeSelfTag.mutate(rowId)}
            isMutating={addSelfTag.isPending || removeSelfTag.isPending}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <CardPhotoCard />
          <LockedFieldsCard
            fields={[
              { label: 'Overall rating', why: 'Averaged from everyone else’s scores.', value: careerAvg?.toString() ?? '—' },
              { label: 'Appearances', why: 'Counted from the matches you’ve actually played.', value: (careerStats?.appearances ?? 0).toString() },
              { label: 'Goals / assists', why: 'Logged from the matchday record.', value: `${careerStats?.goals ?? 0} / ${careerStats?.assists ?? 0}` },
              { label: 'Man of the Match', why: 'Voted by the group, tallied per matchday.', value: (careerStats?.motm ?? 0).toString() },
              {
                label: 'Community tags',
                why: 'Voted onto you by the group.',
                value: communityTags.length > 0 ? communityTags.map((t) => t.label).join(', ') : 'None yet',
              },
              {
                label: 'Joined',
                why: 'Set when your account was created.',
                value: new Date(player.joined_at).toLocaleDateString('en-GB', {
                  month: 'short',
                  year: 'numeric',
                }),
              },
            ]}
          />
          <LeaveGroupCard />
        </div>
      </div>
    </div>
  )
}

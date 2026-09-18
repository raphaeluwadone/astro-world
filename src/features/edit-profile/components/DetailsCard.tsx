import type { Database } from '@/types/database'
import { FieldHint, FieldLabel, TextField } from './FieldInput'

type PositionType = Database['public']['Enums']['position_type']
type FootType = Database['public']['Enums']['foot_type']

export interface DraftFields {
  nickname: string
  full_name: string
  height_cm: string
  weight_kg: string
  favourite_number: string
  favourite_club: string
  bio: string
  positions: PositionType[]
  preferred_foot: FootType | null
}

const POSITIONS: PositionType[] = ['GK', 'DEF', 'ATT', 'UTIL']
const FEET: FootType[] = ['left', 'right', 'both']
const BIO_LIMIT = 220

function togglePill(active: boolean) {
  return active
    ? 'rounded-[9px] bg-astro-accent px-3.5 py-2 text-xs font-extrabold text-astro-on-accent'
    : 'rounded-[9px] border border-border bg-astro-surface-2 px-3.5 py-2 text-xs font-bold text-astro-text-muted hover:text-astro-text'
}

export function DetailsCard({
  draft,
  onChange,
}: {
  draft: DraftFields
  onChange: (patch: Partial<DraftFields>) => void
}) {
  function togglePosition(p: PositionType) {
    const has = draft.positions.includes(p)
    onChange({
      positions: has ? draft.positions.filter((x) => x !== p) : [...draft.positions, p],
    })
  }

  return (
    <div className="astro-card p-6">
      <h2 className="mb-1.5 font-display text-[28px] leading-none text-astro-text">Your Details</h2>
      <p className="mb-5 text-[13px] text-astro-text-dim">
        Nickname leads everywhere. Real name stays secondary.
      </p>
      <div className="flex flex-col gap-4">
        <TextField
          label="Nickname"
          value={draft.nickname}
          onChange={(v) => onChange({ nickname: v })}
          hint="Shown large, everywhere. This is who you are on the app."
        />
        <TextField
          label="Real name"
          value={draft.full_name}
          onChange={(v) => onChange({ full_name: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Height (cm)"
            type="number"
            value={draft.height_cm}
            onChange={(v) => onChange({ height_cm: v })}
          />
          <TextField
            label="Weight (kg)"
            type="number"
            value={draft.weight_kg}
            onChange={(v) => onChange({ weight_kg: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Favourite number"
            type="number"
            value={draft.favourite_number}
            onChange={(v) => onChange({ favourite_number: v })}
            hint="Not a jersey number. Doesn't have to be unique."
          />
          <TextField
            label="Favourite club"
            value={draft.favourite_club}
            onChange={(v) => onChange({ favourite_club: v })}
          />
        </div>

        <div>
          <FieldLabel>Positions</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePosition(p)}
                className={togglePill(draft.positions.includes(p))}
              >
                {p}
              </button>
            ))}
          </div>
          <FieldHint>Pick as many as you honestly play. Utility means you&rsquo;ll go anywhere.</FieldHint>
        </div>

        <div>
          <FieldLabel>Preferred foot</FieldLabel>
          <div className="flex gap-2">
            {FEET.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChange({ preferred_foot: f })}
                className={togglePill(draft.preferred_foot === f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Bio</FieldLabel>
          <textarea
            value={draft.bio}
            maxLength={BIO_LIMIT}
            onChange={(e) => onChange({ bio: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-[10px] border border-white/[0.12] bg-astro-surface-2 px-[15px] py-3.5 text-sm leading-[1.55] text-astro-text focus:outline-none focus:ring-1 focus:ring-astro-accent"
          />
          <FieldHint>{BIO_LIMIT - draft.bio.length} characters left. Keep it funnier than that.</FieldHint>
        </div>
      </div>
    </div>
  )
}

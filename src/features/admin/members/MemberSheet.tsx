import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AdminConfirmDialog } from '@/components/dialogs/AdminConfirmDialog'
import { AstroSelect } from '@/components/ui/astro-select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { MemberPatch, MemberRow } from './api'
import { useSetRole, useUpdateMember } from './hooks'
import { MemberChips } from './MembersPage'

const POSITIONS = ['GK', 'DEF', 'ATT', 'UTIL'] as const
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const LEGACY = [
  ['legacy_appearances', 'Apps'],
  ['legacy_goals', 'Goals'],
  ['legacy_assists', 'Assists'],
  ['legacy_clean_sheets', 'Clean sheets'],
  ['legacy_yellow_cards', 'Yellows'],
  ['legacy_red_cards', 'Reds'],
] as const

// Postgres raises our guard messages verbatim; anything else gets a generic line.
const errText = (e: unknown) => {
  const msg = (e as { message?: string })?.message ?? ''
  if (/duplicate|unique/i.test(msg)) return 'Someone already has that nickname.'
  return /^(You can|Astro needs|Bring them)/.test(msg) ? msg : 'Couldn’t save that. Try again.'
}

const INPUT =
  'min-h-9 w-full rounded-[8px] border border-white/[0.1] bg-astro-admin-bg px-2.5 text-[13px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-cyan/60 focus:outline-none'

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">{label}</span>
      {children}
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/[0.07] px-5 py-4">
      <h3 className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#4d5578]">{title}</h3>
      {children}
    </section>
  )
}

type Form = {
  nickname: string
  full_name: string
  positions: string[]
  preferred_foot: string
  favourite_number: string
  instagram_handle: string
  birthday_month: string
  birthday_day: string
} & Record<(typeof LEGACY)[number][0], string>

function toForm(m: MemberRow): Form {
  const s = (v: number | string | null) => (v == null ? '' : String(v))
  return {
    nickname: m.nickname,
    full_name: m.full_name,
    positions: m.positions,
    preferred_foot: m.preferred_foot ?? '',
    favourite_number: s(m.favourite_number),
    instagram_handle: m.instagram_handle ?? '',
    birthday_month: s(m.birthday_month),
    birthday_day: s(m.birthday_day),
    ...(Object.fromEntries(LEGACY.map(([k]) => [k, s(m[k])])) as Record<(typeof LEGACY)[number][0], string>),
  }
}

function toPatch(f: Form): MemberPatch {
  const n = (v: string) => (v.trim() === '' ? null : Number(v))
  return {
    nickname: f.nickname.trim(),
    full_name: f.full_name.trim(),
    positions: f.positions as MemberPatch['positions'],
    preferred_foot: (f.preferred_foot || null) as MemberPatch['preferred_foot'],
    favourite_number: n(f.favourite_number),
    instagram_handle: f.instagram_handle.trim().replace(/^@/, '') || null,
    birthday_month: n(f.birthday_month),
    birthday_day: n(f.birthday_day),
    ...(Object.fromEntries(LEGACY.map(([k]) => [k, n(f[k]) ?? 0])) as Pick<MemberPatch, (typeof LEGACY)[number][0]>),
  }
}

function SheetBody({ m }: { m: MemberRow }) {
  const { player } = useCurrentPlayer()
  const update = useUpdateMember()
  const role = useSetRole()
  const [form, setForm] = useState(() => toForm(m))
  const [saved, setSaved] = useState(form)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const isMe = m.id === player?.id
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const valid = form.nickname.trim().length > 0 && form.full_name.trim().length > 0
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const save = () =>
    update.mutate(
      { id: m.id, patch: toPatch(form) },
      {
        onSuccess: () => {
          setSaved(form)
          toast.success(`${form.nickname.trim()} updated.`)
        },
        onError: (e) => toast.error(errText(e)),
      },
    )

  const toggle = (r: 'admin' | 'writer' | 'left', on: boolean, done: string) =>
    role.mutate({ id: m.id, role: r, on }, { onSuccess: () => toast.success(done), onError: (e) => toast.error(errText(e)) })

  return (
    <>
      <div className="flex items-center gap-3.5 px-5 pb-4 pt-6">
        <PlayerPhoto playerId={m.id} alt="" className="size-14 shrink-0 rounded-[12px]" />
        <div className="min-w-0">
          <SheetTitle className="font-display text-[30px] font-normal leading-none text-astro-text">{m.nickname}</SheetTitle>
          <SheetDescription className="truncate text-[12.5px] text-astro-text-muted">{m.full_name}</SheetDescription>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <MemberChips m={m} />
            <Link to="/players/$playerId" params={{ playerId: m.id }} className="text-[11.5px] font-bold text-astro-cyan no-underline hover:underline">
              View profile &rarr;
            </Link>
          </div>
        </div>
      </div>

      <Section title="Roles">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-astro-text">Admin</div>
              <div className="text-[11.5px] text-astro-text-dim">{isMe ? 'You can’t remove your own admin access.' : 'Runs matchdays, results, money and this portal.'}</div>
            </div>
            <Switch
              aria-label="Admin"
              checked={m.is_admin}
              disabled={isMe || !!m.left_at || role.isPending}
              onCheckedChange={(on) => toggle('admin', on, on ? `${m.nickname} is an admin now.` : `${m.nickname} isn’t an admin any more.`)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-astro-text">Article writer</div>
              <div className="text-[11.5px] text-astro-text-dim">{m.is_admin ? 'Admins can always write.' : 'Can write and publish articles.'}</div>
            </div>
            <Switch
              aria-label="Article writer"
              checked={m.writer || m.is_admin}
              disabled={m.is_admin || !!m.left_at || role.isPending}
              onCheckedChange={(on) => toggle('writer', on, on ? `${m.nickname} can write articles now.` : `${m.nickname} can’t write articles any more.`)}
            />
          </div>
        </div>
      </Section>

      <Section title="Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nickname">
            <input className={INPUT} value={form.nickname} maxLength={30} onChange={(e) => set({ nickname: e.target.value })} />
          </Field>
          <Field label="Full name">
            <input className={INPUT} value={form.full_name} maxLength={60} onChange={(e) => set({ full_name: e.target.value })} />
          </Field>
          <Field label="Positions" className="col-span-2">
            <div className="flex gap-1.5">
              {POSITIONS.map((p) => {
                const on = form.positions.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ positions: on ? form.positions.filter((x) => x !== p) : [...form.positions, p] })}
                    className={cn(
                      'min-h-8 flex-1 rounded-[8px] border text-xs font-extrabold',
                      on ? 'border-astro-cyan/60 bg-astro-cyan/[0.12] text-astro-text' : 'border-white/[0.1] text-astro-text-dim hover:text-astro-text',
                    )}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="Foot">
            <AstroSelect
              size="sm"
              aria-label="Foot"
              placeholder="Not set"
              value={form.preferred_foot}
              onValueChange={(v) => set({ preferred_foot: v })}
              options={[
                { value: 'right', label: 'Right' },
                { value: 'left', label: 'Left' },
                { value: 'both', label: 'Both' },
              ]}
            />
          </Field>
          <Field label="Number">
            <input className={INPUT} inputMode="numeric" value={form.favourite_number} onChange={(e) => set({ favourite_number: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
          </Field>
          <Field label="Instagram" className="col-span-2">
            <input className={INPUT} value={form.instagram_handle} placeholder="@handle" onChange={(e) => set({ instagram_handle: e.target.value })} />
          </Field>
          <Field label="Birthday month">
            <AstroSelect
              size="sm"
              aria-label="Birthday month"
              placeholder="Not set"
              value={form.birthday_month}
              onValueChange={(v) => set({ birthday_month: v })}
              options={MONTHS.map((label, i) => ({ value: String(i + 1), label }))}
            />
          </Field>
          <Field label="Day">
            <input className={INPUT} inputMode="numeric" value={form.birthday_day} onChange={(e) => set({ birthday_day: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
          </Field>
        </div>
      </Section>

      <Section title="Stats from before Astro">
        <div className="grid grid-cols-3 gap-3">
          {LEGACY.map(([k, label]) => (
            <Field key={k} label={label}>
              <input className={INPUT} inputMode="numeric" value={form[k]} onChange={(e) => set({ [k]: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            </Field>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-white/[0.07] bg-astro-admin-chrome px-5 py-3">
        {m.left_at ? (
          <button
            type="button"
            disabled={role.isPending}
            onClick={() => toggle('left', false, `${m.nickname} is back on the roster.`)}
            className="rounded-[8px] border border-astro-green/45 px-3 py-2 text-[12.5px] font-bold text-astro-green disabled:opacity-50"
          >
            Bring them back
          </button>
        ) : (
          !isMe && (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="rounded-[8px] px-2 py-2 text-[12.5px] font-bold text-astro-text-dim hover:text-astro-red"
            >
              Mark as left
            </button>
          )
        )}
        {dirty && (
          <button type="button" onClick={() => setForm(saved)} className="ml-auto rounded-[8px] px-2.5 py-2 text-[12.5px] font-bold text-astro-text-dim hover:text-astro-text">
            Discard
          </button>
        )}
        <button
          type="button"
          disabled={!dirty || !valid || update.isPending}
          onClick={save}
          className={cn('rounded-[8px] bg-astro-cyan px-4 py-2 text-[12.5px] font-extrabold text-[#04121d] disabled:opacity-40', !dirty && 'ml-auto')}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <AdminConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        eyebrow="Members"
        title={`Mark ${m.nickname} as left?`}
        body={
          <>
            They come off the roster, the pickers and @ tagging, and lose any admin or writer access. Their matches, stats, badges and posts stay
            exactly as they are. You can bring them back any time.
          </>
        }
        confirmLabel="Mark as left"
        isPending={role.isPending}
        onConfirm={() =>
          role.mutate(
            { id: m.id, role: 'left', on: true },
            {
              onSuccess: () => {
                setConfirmLeave(false)
                toast.success(`${m.nickname} is marked as left.`)
              },
              onError: (e) => toast.error(errText(e)),
            },
          )
        }
      />
    </>
  )
}

export function MemberSheet({ member, onOpenChange }: { member: MemberRow | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!member} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-white/[0.09] bg-astro-admin-chrome p-0 text-astro-text data-[side=right]:w-full sm:max-w-md data-[side=right]:sm:max-w-md">
        {member && <SheetBody key={member.id} m={member} />}
      </SheetContent>
    </Sheet>
  )
}

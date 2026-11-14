import { undoToast, withConfirm } from '@/components/dialogs/confirm'
import { useState } from 'react'
import { toast } from 'sonner'
import { AstroSelect } from '@/components/ui/astro-select'
import { PageLoader } from '@/components/states/PageLoader'
import { useAllPlayers } from '@/features/kitty/hooks'
import { DrawRulesForm } from '@/features/matchday/draw/components/DrawRulesForm'
import { useDrawRules, useNeverPairActions, useNeverPairs, useSaveDrawRules } from '@/features/matchday/draw/hooks'
import type { DrawRules } from '@/features/matchday/draw/rules'

function NeverPairs() {
  const { data: pairs = [] } = useNeverPairs()
  const { data: players = [] } = useAllPlayers()
  const { add, remove } = useNeverPairActions()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const name = (id: string) => players.find((p) => p.id === id)?.nickname ?? 'Former player'
  const options = players.map((p) => ({ value: p.id, label: p.nickname }))
  const taken = pairs.some((p) => (p.player_a === a && p.player_b === b) || (p.player_a === b && p.player_b === a))

  return (
    <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
      <h2 className="mb-1 font-display text-[24px] leading-none text-astro-text">Never together</h2>
      <p className="mb-3 text-[12.5px] text-astro-text-muted">These pairs are always drawn on different sides while the rule is on.</p>
      <div className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-2">
        <AstroSelect value={a} onValueChange={setA} options={options.filter((o) => o.value !== b)} placeholder="Player" aria-label="First player" />
        <AstroSelect value={b} onValueChange={setB} options={options.filter((o) => o.value !== a)} placeholder="Player" aria-label="Second player" />
        <button
          type="button"
          disabled={!a || !b || taken || add.isPending}
          onClick={() =>
            add.mutate([a, b], {
              onSuccess: () => {
                setA('')
                setB('')
              },
              onError: () => toast.error('Couldn’t add that pair.'),
            })
          }
          className="min-h-11 rounded-[10px] bg-astro-cyan px-4 text-[13px] font-extrabold text-[#04121d] disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {pairs.length === 0 ? (
        <p className="text-[12.5px] text-astro-text-dim">No pairs yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pairs.map((p) => (
            <li key={p.player_a + p.player_b} className="flex items-center gap-2 rounded-[10px] border border-white/[0.07] px-3 py-2 text-[13px] font-bold text-astro-text">
              {name(p.player_a)} <span className="text-astro-text-dim">and</span> {name(p.player_b)}
              <button type="button" onClick={() => remove.mutate(p, { onSuccess: () => undoToast(`Removed ${name(p.player_a)} and ${name(p.player_b)}`, () => add.mutate([p.player_a, p.player_b])) })} className="ml-auto text-[12px] font-bold text-astro-text-muted hover:text-astro-red">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** The default rules for every draw. Pitch-side starts from these and can change them for one draw. */
export function DrawRulesPage() {
  const { data: saved, isLoading } = useDrawRules()
  const save = useSaveDrawRules()
  const [draft, setDraft] = useState<DrawRules | null>(null)
  if (isLoading || !saved) return <PageLoader />
  const rules = draft ?? saved
  const dirty = draft != null && JSON.stringify(draft) !== JSON.stringify(saved)

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1 className="mb-1 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Draw rules</h1>
        <p className="text-[13px] text-astro-text-muted">
          The defaults for every draw. When rules clash, balance wins. Pitch-side starts from these and can change them for a single draw.
        </p>
      </div>
      <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
        <DrawRulesForm rules={rules} onChange={setDraft} />
        <button
          type="button"
          disabled={!dirty || save.isPending}
          onClick={() =>
            withConfirm({ tone: 'admin', eyebrow: 'Draw rules', title: 'Save as the defaults?', body: 'Every draw from now on starts from these rules. Pitch-side can still change them for one draw.', confirmLabel: 'Save defaults' }, () => save.mutate(rules, {
              onSuccess: () => {
                setDraft(null)
                toast.success('Draw rules saved')
              },
              onError: () => toast.error('Couldn’t save the rules.'),
            }))
          }
          className="mt-3 min-h-11 w-full rounded-[12px] bg-astro-cyan text-[14px] font-extrabold text-[#04121d] disabled:opacity-40"
        >
          {save.isPending ? 'Saving…' : dirty ? 'Save defaults' : 'Saved'}
        </button>
      </section>
      <NeverPairs />
    </div>
  )
}

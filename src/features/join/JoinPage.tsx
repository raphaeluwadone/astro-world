import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { useMemo, useState } from 'react'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'
import { JoinBackdrop } from '@/components/layout/JoinBackdrop'
import { signOut } from '@/features/auth/api'
import { groupCodeMemory, type FreeName } from './api'
import { useFreeNames, useJoinGroup } from './hooks'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const FIELD =
  'w-full rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 px-4 py-3.5 text-base font-bold text-astro-text placeholder:font-semibold placeholder:text-astro-text-dim focus:border-astro-accent focus:outline-none'
const LABEL = 'mb-[9px] text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim'
const PRIMARY = 'min-h-12 rounded-xl bg-astro-accent px-[26px] text-[15px] font-extrabold text-astro-on-accent disabled:opacity-50'

/** Database errors arrive as plain objects with a message, not as Error instances. */
function errorText(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message) return err.message
  return 'Something went wrong. Try again.'
}

type Who = { kind: 'existing'; player: FreeName } | { kind: 'new'; nickname: string; fullName: string }

/** After sign-up: find your name in the roster (or add one), then two optional details. */
export function JoinPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: names = [], isLoading, isError, refetch } = useFreeNames()
  const join = useJoinGroup()

  const [who, setWho] = useState<Who | null>(null)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [newNick, setNewNick] = useState('')
  const [newFull, setNewFull] = useState('')
  const [code, setCode] = useState(groupCodeMemory.get)
  const [insta, setInsta] = useState('')
  const [month, setMonth] = useState<number | null>(null)
  const [day, setDay] = useState('')
  const [error, setError] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const shown = useMemo(() => names.filter((p) => !q || `${p.nickname} ${p.full_name}`.toLowerCase().includes(q)), [names, q])

  async function finish(withDetails: boolean) {
    if (!who) return
    setError(null)
    try {
      await join.mutateAsync({
        code,
        playerId: who.kind === 'existing' ? who.player.id : null,
        nickname: who.kind === 'new' ? who.nickname : '',
        fullName: who.kind === 'new' ? who.fullName : '',
        instagram: withDetails ? insta : '',
        birthdayMonth: withDetails ? month : null,
        birthdayDay: withDetails && day ? Number(day) : null,
      })
      groupCodeMemory.clear()
      await qc.invalidateQueries()
      await navigate({ to: '/' })
    } catch (err) {
      const message = errorText(err)
      setError(message)
      if (message.includes('just taken')) {
        setWho(null)
        void refetch()
      }
      if (message.includes('group code')) setWho(null)
    }
  }

  const heading = who ? (who.kind === 'existing' ? `HI, ${who.player.nickname.toUpperCase()}` : `WELCOME, ${who.nickname.toUpperCase()}`) : "WHICH ONE'S YOU?"
  const dobEcho = !month
    ? 'No year, ever. Only used for the monthly party and the birthday list.'
    : !day
      ? `Born in ${MONTH_LONG[month - 1]}. Add the day so the greeting lands right.`
      : `You'll be in the ${MONTH_LONG[month - 1]} party with everyone else born that month.`

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-astro-bg px-5 py-9 pb-[70px]">
      <JoinBackdrop />
      <div className="relative z-[1] mb-6 flex w-full max-w-[560px] items-center gap-2.5">
        <BrandMarkIcon className="h-9 w-auto shrink-0" />
        <Wordmark size={24} className="text-astro-text" />
        <div className="ml-auto text-[11.5px] text-astro-text-dim">Step {who ? 2 : 1} of 2</div>
      </div>

      <div className="relative z-[1] w-full max-w-[560px]" style={{ animation: 'jn-in 500ms cubic-bezier(.2,.8,.2,1) both' }}>
        <h1 className="mb-2.5 font-display text-[46px] leading-[0.95] text-astro-text">{heading}</h1>

        {!who ? (
          <>
            <p className="mb-5 text-[14.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              Most of the group is already on our list. Tap your name and your record is yours.
            </p>

            <div className="astro-card mb-4 p-5">
              <div className={LABEL}>Group code</div>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="From the group chat" autoCapitalize="characters" autoCorrect="off" className={FIELD} />
              <p className="mt-2 text-[12.5px] text-astro-text-muted">Ask in the group chat if you don’t have it.</p>
            </div>

            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your name" aria-label="Search your name" className={cn(FIELD, 'mb-3')} />

            {isLoading ? (
              <p className="py-6 text-center text-sm text-astro-text-muted">Loading the list…</p>
            ) : isError ? (
              <p className="py-6 text-center text-sm text-astro-red">
                Couldn&rsquo;t load the list.{' '}
                <button type="button" onClick={() => refetch()} className="font-bold underline">
                  Try again
                </button>
              </p>
            ) : (
              <ul className="mb-4 flex max-h-[48vh] flex-col gap-1.5 overflow-y-auto pr-1">
                {shown.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setWho({ kind: 'existing', player: p })}
                      className="astro-tap flex min-h-14 w-full flex-col justify-center rounded-[12px] border border-white/[0.1] bg-astro-surface px-4 text-left hover:border-astro-accent"
                    >
                      <span className="text-base font-extrabold text-astro-text">{p.nickname}</span>
                      {p.full_name && p.full_name.toLowerCase() !== p.nickname.toLowerCase() && <span className="text-[12.5px] text-astro-text-muted">{p.full_name}</span>}
                    </button>
                  </li>
                ))}
                {shown.length === 0 && <li className="py-3 text-center text-sm text-astro-text-muted">{q ? 'No one by that name.' : 'Everyone on the list has been claimed.'}</li>}
              </ul>
            )}

            {adding ? (
              <div className="astro-card p-5">
                <div className="mb-4">
                  <div className={LABEL}>Nickname</div>
                  <input value={newNick} onChange={(e) => setNewNick(e.target.value)} placeholder="What people shout at you" maxLength={30} className={FIELD} />
                </div>
                <div className="mb-4">
                  <div className={LABEL}>Real name</div>
                  <input value={newFull} onChange={(e) => setNewFull(e.target.value)} placeholder="Optional" maxLength={60} className={FIELD} />
                </div>
                <button type="button" disabled={newNick.trim().length < 2} onClick={() => setWho({ kind: 'new', nickname: newNick.trim(), fullName: newFull.trim() })} className={PRIMARY}>
                  Continue
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="min-h-12 w-full rounded-[12px] border border-dashed border-white/[0.2] text-[14px] font-bold text-astro-text-muted hover:text-astro-text">
                I&rsquo;m not on the list
              </button>
            )}
          </>
        ) : (
          <>
            <p className="mb-6 text-[14.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              Two optional things. Skip them and nothing breaks, you just won&rsquo;t get tagged in the Sunday posts or a birthday greeting.
            </p>

            <div className="astro-card mb-3.5 p-6">
              <div className="mb-1.5 font-display text-[26px] leading-none text-astro-text">INSTAGRAM</div>
              <p className="mb-3.5 text-[12.5px] leading-[1.55] text-astro-text-muted">So we can tag you instead of writing &ldquo;the lad in the red boots&rdquo;.</p>
              <div className="flex items-center rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 pl-4">
                <div className="shrink-0 text-base font-bold text-astro-text-dim">@</div>
                <input value={insta} onChange={(e) => setInsta(e.target.value.replace(/^@/, ''))} placeholder="yourhandle" autoCapitalize="none" className="min-w-0 flex-1 bg-transparent px-2 py-3.5 text-base font-bold text-astro-text focus:outline-none" />
              </div>
            </div>

            <div className="astro-card mb-4 p-6">
              <div className="mb-1.5 font-display text-[26px] leading-none text-astro-text">BIRTHDAY</div>
              <p className="mb-4 text-[12.5px] leading-[1.55] text-astro-text-muted">Everyone born in the same month shares one party. We want the month and day, never the year.</p>
              <div className={LABEL}>Month</div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {MONTHS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setMonth(month === i + 1 ? null : i + 1)}
                    className={cn(
                      'astro-tap min-h-10 rounded-lg border px-3.5 text-xs',
                      month === i + 1 ? 'border-astro-accent bg-astro-accent font-extrabold text-astro-on-accent' : 'border-white/[0.09] bg-astro-surface-2 font-semibold text-astro-text-muted',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={LABEL}>Day</div>
              <input value={day} inputMode="numeric" onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="19" className="w-24 rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 px-4 py-3.5 text-center font-display text-2xl text-astro-text focus:border-astro-accent focus:outline-none" />
              <div className="mt-2.5 text-[12.5px] text-astro-text-muted">{dobEcho}</div>
            </div>

            {error && <p className="mb-3 text-sm text-astro-red">{error}</p>}

            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" disabled={join.isPending} onClick={() => finish(true)} className={PRIMARY}>
                {join.isPending ? 'Letting you in…' : 'Let me in'}
              </button>
              <button type="button" disabled={join.isPending} onClick={() => finish(false)} className="min-h-12 px-1.5 text-[13px] font-bold text-astro-text-muted hover:text-astro-text">
                Skip both
              </button>
              <button
                type="button"
                disabled={join.isPending}
                onClick={() => {
                  setWho(null)
                  setError(null)
                }}
                className="min-h-12 px-1.5 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
              >
                Not {who.kind === 'existing' ? who.player.nickname : 'you'}? Go back
              </button>
            </div>
          </>
        )}

        {!who && error && <p className="mt-3 text-sm text-astro-red">{error}</p>}

        {!who && (
          <button
            type="button"
            disabled={join.isPending}
            onClick={async () => {
              groupCodeMemory.clear()
              await signOut()
              qc.clear()
              await navigate({ to: '/login', search: { view: 'signin' } })
            }}
            className="mt-6 min-h-11 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
          >
            Wrong account? Sign out and go back
          </button>
        )}
      </div>
    </div>
  )
}
